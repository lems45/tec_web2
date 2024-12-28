import serial
import requests
import time
from datetime import datetime

# Configuración del puerto serial (ajustar al puerto adecuado)
port = "/dev/ttyUSB0"  # Cambiar a tu puerto (en Linux será algo como "/dev/ttyUSB0")
baud_rate = 9600  # Debe coincidir con la configuración de Arduino

# Configuración de la URL del servidor
server_url = "http://localhost:3000/api/bancodepruebas"  # Cambiar la URL de tu servidor

# Iniciar la conexión serial con Arduino
ser = serial.Serial(port, baud_rate)
time.sleep(2)  # Esperar a que la conexión se establezca

def send_data_to_server(data):
    headers = {'Content-Type': 'application/json'}
    
    try:
        # Enviar los datos al servidor en formato JSON
        response = requests.post(server_url, json=data, headers=headers)
    
    except Exception as e:
        print(f"Error al conectar con el servidor: {e}")

while True:
    if ser.in_waiting > 0:
        # Leer los datos recibidos desde Arduino (en formato CSV)
        raw_data = ser.readline().decode('utf-8').strip()
        #print(f"Datos recibidos de Arduino: {raw_data}")
        
        try:
            # Separar los valores CSV
            valores = raw_data.split(',')
            
            # Obtener el timestamp actual
            timestamp = "2024-12-26T15:30:00"
            #date = timestamp.date()  # Obtener solo la fecha (YYYY-MM-DD)
            #time_str = timestamp.time()  # Obtener solo la hora (HH:MM:SS)

            # Crear el diccionario con los datos y el timestamp dividido
            data = {
                "id_prueba": 0,
                "fuerza": float(valores[0]),
                "temperatura": float(valores[1]),
                "presion": float(valores[2])
            }
            
            #print(timestamp)
            
            # Enviar los datos al servidor
            send_data_to_server(data)
        
        except Exception as e:
            print(f"Error al procesar los datos: {e}")
    
    #time.sleep(1)
