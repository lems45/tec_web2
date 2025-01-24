import serial
import requests
import time

# Configuración del puerto serial (ajustar al puerto adecuado)
port = "/dev/ttyACM0"  # Cambiar a tu puerto (en Linux será algo como "/dev/ttyUSB0")
baud_rate = 9600  # Debe coincidir con la configuración de Arduino

# Configuración de URLs del servidor
server_url_data = "http://localhost:3000/api/bancodepruebas"  # Para enviar datos
server_url_command = "http://localhost:3000/api/ignicion"  # Para consultar el comando

# Iniciar la conexión serial con Arduino
ser = serial.Serial(port, baud_rate)
time.sleep(2)  # Esperar a que la conexión se establezca

def send_data_to_server(data):
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(server_url_data, json=data, headers=headers)
        if response.status_code == 200:
            return True  # POST exitoso
        else:
            print(f"Error en el POST: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error al conectar con el servidor: {e}")
        return False

def check_for_ignition_command():
    try:
        response = requests.get(server_url_command)
        if response.status_code == 200:
            command = response.json().get("command")
            if command == "IGNICION":
                print("Comando de ignición recibido desde el servidor")
                ser.write("IGNICION".encode('utf-8'))
                return True
        return False
    except Exception as e:
        print(f"Error al consultar el comando de ignición: {e}")
        return False

# Lógica principal
while True:
    # Procesar datos desde el Arduino
    if ser.in_waiting > 0:
        raw_data = ser.readline().decode('utf-8').strip()
        try:
            valores = raw_data.split(',')
            data = {
                "id_prueba": 0,
                "fuerza": float(valores[0]),
                "temperatura": float(valores[1]),
                "presion": float(valores[2])
            }
            # Enviar datos al servidor
            if send_data_to_server(data):
                # Solo consultar comando de ignición si el POST fue exitoso
                if check_for_ignition_command():
                    try:
                        # Leer datos específicos del Arduino al recibir el comando
                        ignition_data = ser.readline().decode('utf-8').strip()
                        #print(f"Datos de ignición: {ignition_data}")
                    except Exception as e:
                        print(f"Error al leer datos de ignición: {e}")
        except Exception as e:
            print(f"Error al procesar los datos: {e}")
