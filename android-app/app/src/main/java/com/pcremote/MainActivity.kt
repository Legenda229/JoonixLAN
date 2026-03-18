package com.pcremote

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    private var webSocket: WebSocket? = null
    // Используем OkHttp - стандартную библиотеку Android для сети
    private val client = OkHttpClient.Builder()
        .readTimeout(3, TimeUnit.SECONDS)
        .build()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RemoteApp()
                }
            }
        }
    }

    @Composable
    fun RemoteApp() {
        // Состояния UI
        var ipAddress by remember { mutableStateOf("192.168.") }
        var status by remember { mutableStateOf("Отключено") }

        Column(
            modifier = Modifier
                .padding(24.dp)
                .fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "PC Remote (Native Android)",
                style = MaterialTheme.typography.headlineMedium
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Статус: $status",
                color = if (status == "Подключено!") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(24.dp))

            // Поле ввода локального IP
            OutlinedTextField(
                value = ipAddress,
                onValueChange = { ipAddress = it },
                label = { Text("IP адрес компьютера (роутера)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            // Кнопка подключения
            Button(
                onClick = {
                    status = "Подключение..."
                    connectWebSocket(ipAddress) { newStatus -> 
                        // Обновляем статус в главном потоке
                        runOnUiThread { status = newStatus }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(16.dp)
            ) {
                Text("Подключиться по Wi-Fi")
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Кнопки управления
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Button(
                    onClick = { sendCommand("vol_down") },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) { 
                    Text("Vol -") 
                }
                
                Button(
                    onClick = { sendCommand("play_pause") },
                    modifier = Modifier.weight(1.5f),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary)
                ) { 
                    Text("Play/Pause") 
                }
                
                Button(
                    onClick = { sendCommand("vol_up") },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) { 
                    Text("Vol +") 
                }
            }
        }
    }

    private fun connectWebSocket(ip: String, updateStatus: (String) -> Unit) {
        // Закрываем старое соединение, если есть
        webSocket?.cancel()
        
        // В нативном приложении мы можем спокойно использовать ws:// (без шифрования)
        // Браузер нас больше не блокирует!
        val request = Request.Builder().url("ws://$ip:8765").build()
        
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                updateStatus("Подключено!")
                // Отправляем пароль при успешном соединении
                val authJson = JSONObject().put("tunnel_id", "12345").toString()
                webSocket.send(authJson)
            }
            
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                updateStatus("Ошибка: проверьте IP")
            }
            
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                updateStatus("Отключено")
            }
        })
    }

    private fun sendCommand(action: String) {
        if (webSocket != null) {
            val json = JSONObject().put("action", action).toString()
            webSocket?.send(json)
        }
    }
}
