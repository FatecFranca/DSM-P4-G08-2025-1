#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <DHT.h>
#include <time.h>

#define DHTPIN 2
#define DHTTYPE DHT11

const char* ssid = ""; //Rede Wifi
const char* password = ""; //Senha Wifi
const char* serverName = "http://192.168.100.3:4000/data";

DHT dht(DHTPIN, DHTTYPE);
WiFiClient client;

bool wifiConnected = false;
bool ntpSynced = false;

void setup() {
  Serial.begin(9600);
  delay(1000);
  Serial.println();
  Serial.println("==== INICIALIZAÇÃO ====");
  
  dht.begin();
  Serial.println("Sensor DHT11 iniciado");

  Serial.print("Conectando ao Wi-Fi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 40) {
    delay(500);
    Serial.print(".");
    Serial.flush();
    tentativas++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("[OK] Wi-Fi conectado");
    Serial.print("Endereço IP atribuído: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[ERRO] Não foi possível conectar ao Wi-Fi");
  }

  if (wifiConnected) {
    Serial.println("Sincronizando hora via NTP...");
    configTime(0, 0, "pool.ntp.org");

    int espera = 0;
    while (time(nullptr) < 100000 && espera < 40) {
      delay(500);
      Serial.print(".");
      Serial.flush();
      espera++;
    }
    Serial.println();

    if (time(nullptr) >= 100000) {
      ntpSynced = true;
      Serial.println("[OK] Hora sincronizada com sucesso");
    } else {
      Serial.println("[ERRO] Falha na sincronização de hora NTP");
    }
  }

  Serial.println("========================");
}

void loop() {
  if (!wifiConnected) {
    Serial.println("[ERRO] Wi-Fi não conectado, não é possível enviar dados.");
    delay(10000);
    return;
  }

  if (!ntpSynced) {
    Serial.println("[ERRO] NTP não sincronizado, timestamp pode estar incorreto.");
  }

  Serial.println("\n==== NOVA LEITURA ====");
  Serial.println("Lendo dados do sensor...");

  float temperatura = dht.readTemperature();
  float umidade = dht.readHumidity();
  time_t timestamp = time(nullptr);

  if (isnan(temperatura) || isnan(umidade)) {
    Serial.println("[ERRO] Falha na leitura do sensor DHT11");
    delay(2000);
    return;
  }

  Serial.print("Temperatura lida: ");
  Serial.print(temperatura);
  Serial.println(" °C");

  Serial.print("Umidade lida: ");
  Serial.print(umidade);
  Serial.println(" %");

  Serial.print("Timestamp atual (Unix): ");
  Serial.println((unsigned long)timestamp);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERRO] Conexão Wi-Fi perdida!");
    wifiConnected = false;
    return;
  } else {
    Serial.print("IP atual do dispositivo: ");
    Serial.println(WiFi.localIP());
  }

  HTTPClient http;
  Serial.println("Iniciando requisição HTTP para a API...");

  if (!http.begin(client, serverName)) {
    Serial.println("[ERRO] Falha ao iniciar conexão HTTP");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"humidity\":\"" + String(umidade, 2) + "\",";
  json += "\"location\":\"Escritório\",";
  json += "\"temperature\":\"" + String(temperatura, 2) + "\",";
  json += "\"timestamp_TTL\":" + String((unsigned long)timestamp);
  json += "}";

  Serial.println("Corpo JSON sendo enviado:");
  Serial.println(json);

  int httpResponseCode = http.POST(json);

  if (httpResponseCode > 0) {
    Serial.print("[OK] Código de resposta HTTP: ");
    Serial.println(httpResponseCode);

    String payload = http.getString();
    Serial.println("Resposta recebida da API:");
    Serial.println(payload);
  } else {
    Serial.print("[ERRO] Código de falha HTTP: ");
    Serial.println(httpResponseCode);
    if (httpResponseCode == -1) Serial.println("→ Possível causa: servidor não acessível (verifique IP/API)");
  }

  http.end();
  Serial.println("==== FIM DO CICLO ====");
  delay(600000);
}
