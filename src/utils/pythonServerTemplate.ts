export const PYTHON_SERVER_CODE = `import asyncio
import websockets
import json
import base64
import mss
from PIL import Image
import io
import time
from pynput.keyboard import Controller as KeyboardController, Key
from pynput.mouse import Controller as MouseController, Button
import sys

keyboard = KeyboardController()
mouse = MouseController()

# Настройки по умолчанию
PORT = 8765
TUNNEL_ID = "12345" # Измените на свой пароль
QUALITY = 50
IS_STREAMING = False

# Маппинг специальных клавиш из JS в pynput
KEY_MAP = {
    "Enter": Key.enter, "Space": Key.space, "Backspace": Key.backspace,
    "Escape": Key.esc, "Tab": Key.tab, "Shift": Key.shift,
    "Control": Key.ctrl, "Alt": Key.alt, "ArrowUp": Key.up,
    "ArrowDown": Key.down, "ArrowLeft": Key.left, "ArrowRight": Key.right,
    "Meta": Key.cmd, "Delete": Key.delete
}

async def handle_client(websocket, *args):
    global IS_STREAMING
    try:
        client_ip = websocket.remote_address[0] if websocket.remote_address else "Unknown"
    except:
        client_ip = "Unknown"
    print(f"\\n[+] Новое подключение от: {client_ip}")
    print("[*] Ожидание пароля (ID) от клиента...")
    
    try:
        # Ждем сообщение с авторизацией (таймаут 10 секунд)
        auth_msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
        auth_data = json.loads(auth_msg)
        
        received_id = auth_data.get("tunnel_id")
        print(f"[*] Получен пароль: {received_id}")
        
        if str(received_id) != str(TUNNEL_ID):
            print(f"[-] ОШИБКА: Неверный пароль! Ожидался: {TUNNEL_ID}")
            await websocket.send(json.dumps({"status": "error", "message": "Неверный ID туннеля"}))
            return
            
        await websocket.send(json.dumps({"status": "success"}))
        print("[+] Клиент УСПЕШНО авторизован! Связь установлена.")

        stream_task = asyncio.create_task(stream_screen(websocket))
        command_task = asyncio.create_task(receive_commands(websocket))
        
        done, pending = await asyncio.wait(
            [stream_task, command_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
            
    except asyncio.TimeoutError:
        print("[-] ОШИБКА: Клиент подключился, но не прислал пароль в течение 10 секунд.")
    except websockets.exceptions.ConnectionClosed:
        print("[-] Клиент отключился.")
    except Exception as e:
        print(f"[-] Ошибка соединения: {e}")
    finally:
        IS_STREAMING = False
        print("[*] Соединение закрыто. Ожидание новых клиентов...")

async def stream_screen(websocket):
    global QUALITY, IS_STREAMING
    with mss.mss() as sct:
        # Пытаемся захватить основной монитор
        monitor = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
        
        while True:
            try:
                if not IS_STREAMING:
                    await asyncio.sleep(0.1)
                    continue

                # Захват экрана
                sct_img = sct.grab(monitor)
                img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                
                # Оптимизация разрешения в зависимости от качества
                scale = max(0.4, QUALITY / 100.0)
                new_size = (int(img.width * scale), int(img.height * scale))
                img.thumbnail(new_size, Image.Resampling.LANCZOS)
                
                # Оптимизация: сжатие JPEG
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=int(QUALITY), optimize=True)
                
                # Кодирование в Base64
                b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                
                send_start = time.time()
                await websocket.send(json.dumps({
                    "type": "frame",
                    "image": b64
                }))
                send_duration = time.time() - send_start
                
                # Адаптивная оптимизация сети (Приоритет качества)
                sleep_time = 0.016 # ~60 FPS default
                if send_duration > 0.05:
                    # Плохой интернет: немного снижаем качество, но сильно режем FPS
                    QUALITY = max(40, QUALITY - 2)
                    sleep_time = 0.1 # ~10 FPS
                elif send_duration > 0.02:
                    # Средний интернет
                    QUALITY = max(60, QUALITY - 1)
                    sleep_time = 0.033 # ~30 FPS
                else:
                    # Отличный интернет
                    QUALITY = min(90, QUALITY + 2)
                
                await asyncio.sleep(sleep_time)
            except websockets.exceptions.ConnectionClosed:
                break
            except Exception as e:
                print(f"Ошибка стриминга: {e}")
                await asyncio.sleep(1)

async def receive_commands(websocket):
    global QUALITY, IS_STREAMING
    async for message in websocket:
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "start_stream":
                IS_STREAMING = True
                QUALITY = data.get("quality", 50)
                print(f"[*] Трансляция экрана запущена. Качество: {QUALITY}%")
            
            elif msg_type == "stop_stream":
                IS_STREAMING = False
                print("[*] Трансляция экрана остановлена.")
                
            elif msg_type == "set_quality":
                QUALITY = data.get("quality", 50)
                
            elif msg_type == "take_screenshot":
                with mss.mss() as sct:
                    mon = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
                    sct_img = sct.grab(mon)
                    img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG", quality=80)
                    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                    await websocket.send(json.dumps({
                        "type": "screenshot",
                        "image": b64
                    }))
            
            elif msg_type == "keydown":
                key = data.get("key")
                if key in KEY_MAP:
                    keyboard.press(KEY_MAP[key])
                elif len(key) == 1:
                    keyboard.press(key)
                    
            elif msg_type == "keyup":
                key = data.get("key")
                if key in KEY_MAP:
                    keyboard.release(KEY_MAP[key])
                elif len(key) == 1:
                    keyboard.release(key)
                    
            elif msg_type == "mouse_move":
                x, y = data.get("x"), data.get("y")
                with mss.mss() as sct:
                    mon = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
                    mouse.position = (mon["left"] + x * mon["width"], mon["top"] + y * mon["height"])
                    
            elif msg_type == "mouse_click":
                button = Button.left if data.get("button") == 0 else Button.right
                if data.get("action") == "down":
                    mouse.press(button)
                else:
                    mouse.release(button)
                
        except Exception as e:
            print(f"[-] Ошибка обработки команды: {e}")

async def main():
    print("="*50)
    print(f"🚀 СЕРВЕР УПРАВЛЕНИЯ ПК ЗАПУЩЕН")
    print(f"📡 Порт: {PORT}")
    print(f"🔑 Пароль (ID): {TUNNEL_ID}")
    print("="*50)
    print("\\nОжидание подключений...")
    
    # Запускаем сервер, который слушает все интерфейсы
    async with websockets.serve(handle_client, "0.0.0.0", PORT, ping_interval=20, ping_timeout=20):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\nСервер остановлен пользователем.")
        sys.exit(0)
`;
