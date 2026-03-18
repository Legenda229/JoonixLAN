import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [ip, setIp] = useState('');
  const [status, setStatus] = useState('Отключено');
  const ws = useRef<WebSocket | null>(null);

  const connect = () => {
    if (!ip) {
      Alert.alert('Ошибка', 'Введите IP или адрес туннеля (например, lhr.life)');
      return;
    }

    let cleanIp = ip.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/$/, '');
    let wsUrl = `ws://${cleanIp}:8765`;
    
    // Если это туннель (буквенный адрес)
    if (/[a-zA-Z]/.test(cleanIp) && cleanIp !== 'localhost') {
      wsUrl = `wss://${cleanIp}`;
    }

    setStatus('Подключение...');
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setStatus('Подключено!');
      // Отправляем пароль (tunnel_id)
      ws.current?.send(JSON.stringify({ tunnel_id: "12345" }));
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === 'success') {
          console.log('Авторизация успешна');
        }
      } catch (err) {
        console.log('Message:', e.data);
      }
    };

    ws.current.onerror = () => {
      setStatus('Ошибка подключения');
      Alert.alert('Ошибка', 'Не удалось подключиться. Проверьте адрес и запущен ли сервер.');
    };

    ws.current.onclose = () => {
      setStatus('Отключено');
    };
  };

  const sendCommand = (action: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action }));
    } else {
      Alert.alert('Ошибка', 'Сначала подключитесь к ПК');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>PC Remote Native</Text>
        <Text style={styles.status}>Статус: {status}</Text>
        
        <TextInput 
          style={styles.input}
          placeholder="IP (192.168.x.x) или lhr.life"
          value={ip}
          onChangeText={setIp}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity style={styles.button} onPress={connect}>
          <Text style={styles.buttonText}>Подключиться</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => sendCommand('vol_down')}>
          <Text style={styles.controlBtnText}>Vol -</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtnMain} onPress={() => sendCommand('play_pause')}>
          <Text style={styles.controlBtnText}>Play/Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => sendCommand('vol_up')}>
          <Text style={styles.controlBtnText}>Vol +</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f2f2f7', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20 
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 30,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10,
    textAlign: 'center',
    color: '#1c1c1e'
  },
  status: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: { 
    width: '100%', 
    height: 50, 
    backgroundColor: '#f2f2f7',
    borderRadius: 10, 
    paddingHorizontal: 15, 
    marginBottom: 15,
    fontSize: 16,
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 15, 
    borderRadius: 10, 
    width: '100%', 
    alignItems: 'center' 
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 16,
  },
  controls: { 
    flexDirection: 'row', 
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  controlBtn: { 
    backgroundColor: '#34C759', 
    padding: 15, 
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  controlBtnMain: {
    backgroundColor: '#FF9500', 
    padding: 15, 
    borderRadius: 12,
    flex: 1.5,
    alignItems: 'center',
  },
  controlBtnText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16,
  }
});
