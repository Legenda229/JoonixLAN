import asyncio
import json
import os
import base64
import platform
from io import BytesIO

try:
    import websockets
    import pyautogui
    from mss import mss
    from PIL import Image
except ImportError:
    print("Пожалуйста, установите необходимые библиотеки:")
    print("pip install websockets pyautogui mss Pillow")
    exit(1)

# Настройки безопасности (замените на свои)
TUNNEL_ID = "joonix-tunnel-123"
PORT = 8765

# Инициализация захвата экрана
sct = mss()

# Настройка pyautogui для безопасности (Fail-Safe)
pyautogui.FAILSAFE = False

async def capture_screen():
    """Захват экрана и конвертация в base64 JPEG"""
    monitor = sct.monitors[1]  # Основной монитор
    sct_img = sct.grab(monitor)
    img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
    
    # Сжатие для быстрой передачи
    img.thumbnail((1280, 720))
    
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=60)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

async def handle_client(websocket, path):
    print(f"Новое подключение: {websocket.remote_address}")
    
    # Ожидание авторизации
    try:
        auth_message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
        auth_data = json.loads(auth_message)
        
        if auth_data.get("tunnel_id") != TUNNEL_ID:
            print("Ошибка авторизации: неверный ID туннеля")
            await websocket.send(json.dumps({"status": "error", "message": "Invalid Tunnel ID"}))
            await websocket.close()
            return
            
        await websocket.send(json.dumps({"status": "success", "message": "Connected to JoonixLAN"}))
        print("Клиент успешно авторизован")
        
    except Exception as e:
        print(f"Ошибка при авторизации: {e}")
        return

    # Основной цикл обработки команд
    is_streaming = False
    
    async def stream_video():
        nonlocal is_streaming
        while is_streaming:
            try:
                frame = await capture_screen()
                await websocket.send(json.dumps({
                    "type": "stream",
                    "data": f"data:image/jpeg;base64,{frame}"
                }))
                await asyncio.sleep(0.05)  # ~20 FPS
            except Exception as e:
                print(f"Ошибка стриминга: {e}")
                is_streaming = False
                break

    stream_task = None

    try:
        async for message in websocket:
            data = json.loads(message)
            cmd_type = data.get("type")

            if cmd_type == "start_stream":
                if not is_streaming:
                    is_streaming = True
                    stream_task = asyncio.create_task(stream_video())
                    print("Трансляция запущена")
                    
            elif cmd_type == "stop_stream":
                is_streaming = False
                if stream_task:
                    stream_task.cancel()
                print("Трансляция остановлена")

            elif cmd_type == "mouse_move":
                # Относительное перемещение (тачпад)
                dx = data.get("dx", 0)
                dy = data.get("dy", 0)
                pyautogui.moveRel(dx, dy, _pause=False)

            elif cmd_type == "mouse_click":
                button = data.get("button", "left")
                pyautogui.click(button=button, _pause=False)

            elif cmd_type == "key_press":
                key = data.get("key")
                if key:
                    # Маппинг специальных клавиш
                    key_map = {
                        "Enter": "enter",
                        "Backspace": "backspace",
                        "Escape": "esc",
                        "Tab": "tab",
                        " ": "space"
                    }
                    mapped_key = key_map.get(key, key.lower())
                    try:
                        pyautogui.press(mapped_key, _pause=False)
                    except ValueError:
                        print(f"Неизвестная клавиша: {key}")

            elif cmd_type == "power_off":
                print("Получена команда выключения ПК")
                if platform.system() == "Windows":
                    os.system("shutdown /s /t 10") # Выключение через 10 секунд
                elif platform.system() == "Linux":
                    os.system("shutdown -h now")
                elif platform.system() == "Darwin": # macOS
                    os.system("sudo shutdown -h now")

            elif cmd_type == "restart":
                print("Получена команда перезагрузки ПК")
                if platform.system() == "Windows":
                    os.system("shutdown /r /t 10")
                elif platform.system() == "Linux":
                    os.system("shutdown -r now")
                elif platform.system() == "Darwin":
                    os.system("sudo shutdown -r now")

    except websockets.exceptions.ConnectionClosed:
        print("Клиент отключился")
    finally:
        is_streaming = False
        if stream_task:
            stream_task.cancel()

async def main():
    print(f"Запуск сервера JoonixLAN на порту {PORT}...")
    print(f"ID туннеля: {TUNNEL_ID}")
    
    async with websockets.serve(handle_client, "0.0.0.0", PORT):
        await asyncio.Future()  # Работает вечно

if __name__ == "__main__":
    asyncio.run(main())
