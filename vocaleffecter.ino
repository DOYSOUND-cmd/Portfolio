#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <driver/dac.h>

// 定義
#define MIC_PIN 39        // ADCのピン（GPIO39）
#define DAC_PIN DAC_CHANNEL_1  // DACのピン（GPIO25）
#define FILTER_SIZE 10    // 平均化フィルタのサイズ
#define EEPROM_SIZE 128    // EEPROMのサイズ

int gain = 2000;       // GAIN
int threshold = 500;   // Threshold
int toneValue = 500;   // Tone
int level = 128;       // Level
int decay = 50;        // Reverb DECAY
int mix = 50;          // Reverb MIX
int reverbTone = 500;  // Reverb TONE

bool noiseGateOn = true;
bool distortionOn = true;
bool reverbOn = true;

int adcValues[FILTER_SIZE];
int filterIndex = 0;

const char* ssid = "ESP32";
const char* password = "DOYSOUND";

WebServer server(80);

// フロントエンドのHTMLを含む変数
const char* htmlContent = R"rawliteral(
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESP32_Vocal_Effector</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #ddd;
            margin: 0;
            font-family: fantasy, Arial, sans-serif;
        }

        .pedal-container {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .pedal {
            width: 200px;
            height: 400px;
            border-radius: 10px;
            box-shadow: 10px 10px 20px rgba(0, 0, 0, 0.5);
            padding: 10px;
            position: relative;
            box-sizing: border-box;
        }

        .knob-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            position: relative;
            top: 20px;
        }

        .knob-container {
            position: relative;
            width: 50px;
            height: 50px;
            margin-bottom: 20px;
        }

        .knob {
            width: 50px;
            height: 50px;
            background-color: #000;
            border-radius: 50%;
            position: relative;
            cursor: pointer;
            box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.5), 0 0 10px rgba(0, 0, 0, 0.5);
            border: 2px solid #333;
        }

        .knob::before {
            content: '';
            position: absolute;
            width: 8px;
            height: 25px;
            background-color: #ccc;
            border-radius: 2px;
            top: 5px;
            left: 21px;
            transform-origin: bottom;
            box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.5);
        }

        .knob-label {
            position: absolute;
            width: 100%;
            text-align: center;
            top: 60px;
            font-size: 16px;
            color: #000;
        }

        .output-value {
            position: absolute;
            width: 100%;
            text-align: center;
            top: -20px;
            font-size: 16px;
            color: #000;
            overflow: hidden;
            white-space: nowrap;
        }

        .output {
            position: absolute;
            top: 350px;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 20px;
            color: #fff;
        }

        .brand {
            position: absolute;
            bottom: 120px;
            left: 0;
            width: 100%;
            text-align: center;
            color: #000;
            font-size: 24px;
            font-weight: bold;
        }

        .foot-switch {
            position: absolute;
            bottom: 10px;
            left: 10px;
            right: 10px;
            height: 70px;
            background-color: #444;
            border-radius: 5px;
            text-align: center;
            line-height: 70px;
            color: #fff;
            font-weight: bold;
            box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.3), 0 5px 15px rgba(0, 0, 0, 0.3);
            border: 2px solid #333;
            cursor: pointer;
        }

        .led {
            position: absolute;
            top: 70px;
            left: 50%;
            width: 10px;
            height: 10px;
            background-color: #8b0000;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
            transform: translateX(-50%);
            transition: background-color 0.3s, box-shadow 0.3s;
        }

        .led.on {
            background-color: #ff0000;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
        }

        /* エフェクターごとの色設定 */
        #noise-gate {
            background-color: #f9f9f9;
        }

        #distortion {
            background-color: #ff6600;
        }

        #reverb {
            background-color: #ccff99;
        }

        @media (max-width: 600px) {
            .pedal-container {
                flex-direction: column-reverse;
                gap: 20px;
                align-items: center;
                margin-top: 600px;
            }
        }
    </style>
</head>
<body>
    <div class="pedal-container">
        <div class="pedal" id="reverb">
            <div class="knob-row">
                <div class="knob-container">
                    <div class="output-value" id="outputValue5">50</div>
                    <div class="knob" id="knob5"></div>
                    <div class="knob-label">DECAY</div>
                </div>
                <div class="knob-container">
                    <div class="output-value" id="outputValue6">50</div>
                    <div class="knob" id="knob6"></div>
                    <div class="knob-label">MIX</div>
                </div>
            </div>
            <div class="knob-container" style="margin: 0 auto; position: relative; top: 40px;">
                <div class="output-value" id="outputValue7">50</div>
                <div class="knob" id="knob7"></div>
                <div class="knob-label">TONE</div>
            </div>
            <div class="led" id="led3"></div>
            <div class="output">Output: <span id="outputValueReverb">50</span></div>
            <div class="brand">Reverb</div>
            <div class="foot-switch" id="footSwitch3"></div>
        </div>

        <div class="pedal" id="distortion">
            <div class="knob-row">
                <div class="knob-container">
                    <div class="output-value" id="outputValue2">50</div>
                    <div class="knob" id="knob2"></div>
                    <div class="knob-label">LEVEL</div>
                </div>
                <div class="knob-container">
                    <div class="output-value" id="outputValue3">50</div>
                    <div class="knob" id="knob3"></div>
                    <div class="knob-label">GAIN</div>
                </div>
            </div>
            <div class="knob-container" style="margin: 0 auto; position: relative; top: 40px;">
                <div class="output-value" id="outputValue4">50</div>
                <div class="knob" id="knob4"></div>
                <div class="knob-label">TONE</div>
            </div>
            <div class="led" id="led2"></div>
            <div class="output">Output: <span id="outputValueDistortion">50</span></div>
            <div class="brand">Distortion</div>
            <div class="foot-switch" id="footSwitch2"></div>
        </div>

        <div class="pedal" id="noise-gate">
            <div class="knob-container" style="margin: 0 auto; position: relative; top: 100px;">
                <div class="output-value" id="outputValue1">50</div>
                <div class="knob" id="knob1"></div>
                <div class="knob-label" style= "right: 10px; top:70px">THRESHOLD</div>
            </div>
            <div class="led" id="led1"></div>
            <div class="output">Output: <span id="outputValueNoiseGate">50</span></div>
            <div class="brand">Noise Gate</div>
            <div class="foot-switch" id="footSwitch1"></div>
        </div>
    </div>

    <script>
        function createKnob(knobId, outputId, paramName) {
            const knob = document.getElementById(knobId);
            const output = document.getElementById(outputId);
            let rotation = -150;

            function updateKnob(e, initialY) {
                const clientY = e.clientY || e.touches[0].clientY;
                const deltaY = initialY - clientY;
                rotation = Math.max(-150, Math.min(150, rotation + deltaY));
                knob.style.transform = `rotate(${rotation}deg)`;
                const value = Math.round((rotation + 150) / 3); // 0から100にマッピング
                output.textContent = value;
                initialY = clientY;

                sendValueToESP32(paramName, value);
            }

            knob.addEventListener('mousedown', function(e) {
                e.preventDefault();
                let initialY = e.clientY;
                function mouseMoveHandler(e) {
                    updateKnob(e, initialY);
                }
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', function() {
                    document.removeEventListener('mousemove', mouseMoveHandler);
                });
            });

            knob.addEventListener('touchstart', function(e) {
                e.preventDefault();
                let initialY = e.touches[0].clientY;
                function touchMoveHandler(e) {
                    updateKnob(e, initialY);
                }
                document.addEventListener('touchmove', touchMoveHandler);
                document.addEventListener('touchend', function() {
                    document.removeEventListener('touchmove', touchMoveHandler);
                });
            });
        }

        function sendValueToESP32(paramName, value) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/set?" + paramName + "=" + value, true);
            xhr.send();
        }

        function createFootSwitch(footSwitchId, ledId) {
            const footSwitch = document.getElementById(footSwitchId);
            const led = document.getElementById(ledId);

            footSwitch.addEventListener('click', function() {
                led.classList.toggle('on');
                sendValueToESP32(footSwitchId, led.classList.contains('on') ? 1 : 0);
            });
        }

        function valueToRotation(value) {
            return (value * 3) - 150;
        }

        createKnob('knob1', 'outputValue1', 'threshold');
        createKnob('knob2', 'outputValue2', 'level');
        createKnob('knob3', 'outputValue3', 'gain');
        createKnob('knob4', 'outputValue4', 'toneValue');
        createKnob('knob5', 'outputValue5', 'decay');
        createKnob('knob6', 'outputValue6', 'mix');
        createKnob('knob7', 'outputValue7', 'reverbTone');

        createFootSwitch('footSwitch1', 'led1');
        createFootSwitch('footSwitch2', 'led2');
        createFootSwitch('footSwitch3', 'led3');

        window.onload = function() {
            fetch('/getSettings')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('outputValue1').textContent = data.threshold;
                    document.getElementById('outputValue2').textContent = data.level;
                    document.getElementById('outputValue3').textContent = data.gain;
                    document.getElementById('outputValue4').textContent = data.toneValue;
                    document.getElementById('outputValue5').textContent = data.decay;
                    document.getElementById('outputValue6').textContent = data.mix;
                    document.getElementById('outputValue7').textContent = data.reverbTone;

                    // 各ノブの位置を設定
                    document.getElementById('knob1').style.transform = `rotate(${valueToRotation(data.threshold)}deg)`;
                    document.getElementById('knob2').style.transform = `rotate(${valueToRotation(data.level)}deg)`;
                    document.getElementById('knob3').style.transform = `rotate(${valueToRotation(data.gain)}deg)`;
                    document.getElementById('knob4').style.transform = `rotate(${valueToRotation(data.toneValue)}deg)`;
                    document.getElementById('knob5').style.transform = `rotate(${valueToRotation(data.decay)}deg)`;
                    document.getElementById('knob6').style.transform = `rotate(${valueToRotation(data.mix)}deg)`;
                    document.getElementById('knob7').style.transform = `rotate(${valueToRotation(data.reverbTone)}deg)`;

                    // フットスイッチの状態を反映
                    if (data.noiseGateOn) {
                        document.getElementById('led1').classList.add('on');
                    }
                    if (data.distortionOn) {
                        document.getElementById('led2').classList.add('on');
                    }
                    if (data.reverbOn) {
                        document.getElementById('led3').classList.add('on');
                    }
                });
        };
    </script>
</body>
</html>
)rawliteral";

// EEPROMから設定値を読み込む
void loadSettings() {
    EEPROM.begin(EEPROM_SIZE);
    gain = EEPROM.read(0) | (EEPROM.read(1) << 8);
    threshold = EEPROM.read(2) | (EEPROM.read(3) << 8);
    toneValue = EEPROM.read(4) | (EEPROM.read(5) << 8);
    level = EEPROM.read(6);
    decay = EEPROM.read(7);
    mix = EEPROM.read(8);
    reverbTone = EEPROM.read(9) | (EEPROM.read(10) << 8);

    noiseGateOn = EEPROM.read(11);
    distortionOn = EEPROM.read(12);
    reverbOn = EEPROM.read(13);

    EEPROM.end();
}

// EEPROMに設定値を書き込む
void saveSettings() {
    EEPROM.begin(EEPROM_SIZE);
    EEPROM.write(0, gain & 0xFF);
    EEPROM.write(1, (gain >> 8) & 0xFF);
    EEPROM.write(2, threshold & 0xFF);
    EEPROM.write(3, (threshold >> 8) & 0xFF);
    EEPROM.write(4, toneValue & 0xFF);
    EEPROM.write(5, (toneValue >> 8) & 0xFF);
    EEPROM.write(6, level);
    EEPROM.write(7, decay);
    EEPROM.write(8, mix);
    EEPROM.write(9, reverbTone & 0xFF);
    EEPROM.write(10, (reverbTone >> 8) & 0xFF);

    EEPROM.write(11, noiseGateOn);
    EEPROM.write(12, distortionOn);
    EEPROM.write(13, reverbOn);

    EEPROM.commit();
    EEPROM.end();
}

// 現在の設定値をフロントエンドに送信する
void handleGetSettings() {
    String json = "{";
    json += "\"threshold\":" + String(threshold * 100 / 4095) + ",";
    json += "\"level\":" + String(level * 100 / 255) + ",";
    json += "\"gain\":" + String(gain * 100 / 4095) + ",";
    json += "\"toneValue\":" + String(toneValue * 100 / 4095) + ",";
    json += "\"decay\":" + String(decay) + ",";
    json += "\"mix\":" + String(mix) + ",";
    json += "\"reverbTone\":" + String(reverbTone * 100 / 4095) + ",";
    json += "\"noiseGateOn\":" + String(noiseGateOn) + ",";
    json += "\"distortionOn\":" + String(distortionOn) + ",";
    json += "\"reverbOn\":" + String(reverbOn);
    json += "}";

    server.send(200, "application/json", json);
}

// 設定値を受信して更新
void handleSet() {
    if (server.hasArg("threshold")) {
        int value = server.arg("threshold").toInt();
        threshold = value * 4095 / 100;
    }
    if (server.hasArg("level")) {
        int value = server.arg("level").toInt();
        level = value * 255 / 100;
    }
    if (server.hasArg("gain")) {
        int value = server.arg("gain").toInt();
        gain = value * 4095 / 100;
    }
    if (server.hasArg("toneValue")) {
        int value = server.arg("toneValue").toInt();
        toneValue = value * 4095 / 100;
    }
    if (server.hasArg("decay")) {
        decay = server.arg("decay").toInt(); // 0-100
    }
    if (server.hasArg("mix")) {
        mix = server.arg("mix").toInt(); // 0-100
    }
    if (server.hasArg("reverbTone")) {
        int value = server.arg("reverbTone").toInt();
        reverbTone = value * 4095 / 100;
    }

    // フットスイッチの状態を更新
    if (server.hasArg("footSwitch1")) {
        noiseGateOn = server.arg("footSwitch1").toInt() == 1;
    }
    if (server.hasArg("footSwitch2")) {
        distortionOn = server.arg("footSwitch2").toInt() == 1;
    }
    if (server.hasArg("footSwitch3")) {
        reverbOn = server.arg("footSwitch3").toInt() == 1;
    }

    saveSettings();
    server.send(200, "text/plain", "OK");
}

void setup() {
    Serial.begin(115200);

    // DACの初期化
    dac_output_enable(DAC_PIN);

    // フィルタバッファの初期化
    for (int i = 0; i < FILTER_SIZE; i++) {
        adcValues[i] = 0;
    }

    // EEPROMから設定値を読み込む
    loadSettings();

    // Wi-Fi APモードの設定
    WiFi.softAP(ssid, password);
    IPAddress IP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(IP);

    // Webサーバの設定
    server.on("/", []() {
        server.send(200, "text/html", htmlContent);
    });
    server.on("/set", handleSet);
    server.on("/getSettings", handleGetSettings);
    server.begin();
    Serial.println("Web server started");
}

void loop() {
    server.handleClient();

    // すべてのエフェクトがオフの場合
    if (!noiseGateOn && !distortionOn && !reverbOn) {
        // マイクからアナログ信号を読み取る
        int adcValue = analogRead(MIC_PIN);

        // 読み取った値をDAC経由で出力
        int dacValue = map(adcValue, 0, 4095, 0, 255);
        dac_output_voltage(DAC_PIN, dacValue);
        return;
    }

    // マイクからアナログ信号を読み取る
    int adcValue = analogRead(MIC_PIN);

    // ノイズゲートがオンの場合、ノイズとして捨てる
    if (noiseGateOn && adcValue <= threshold) {
        adcValue = 0;
    }

    // フィルタバッファに新しい値を追加
    adcValues[filterIndex] = adcValue;
    filterIndex = (filterIndex + 1) % FILTER_SIZE;

    // フィルタバッファの平均値を計算
    int sum = 0;
    for (int i = 0; i < FILTER_SIZE; i++) {
        sum += adcValues[i];
    }
    int filteredValue = sum / FILTER_SIZE;

    // クリッピングによるディストーション処理
    int processedValue = filteredValue;
    if (distortionOn) {
        processedValue = map(processedValue, 0, 4095, 3000, 4095);
        if (filteredValue > gain) {
            processedValue = 4095;
        } else if (filteredValue < 4095 - gain) {
            processedValue = 0;
        }
    }

    // エフェクト処理 (Tone, Level, Reverb)
    if (reverbOn) {
        static int previousValue = 0;
        int reverbValue = (processedValue * (100 - decay) + previousValue * decay) / 100;
        previousValue = reverbValue;

        reverbValue = map(reverbValue, 0, 4095, 0, reverbTone);

        processedValue = (processedValue * (100 - mix) + reverbValue * mix) / 100;
    }

    // Toneの適用
    processedValue = map(processedValue, 0, 4095, 0, toneValue);

    // 読み取った値をDAC経由で出力
    int dacValue = map(processedValue, 0, 4095, 0, level);
    dac_output_voltage(DAC_PIN, dacValue);
}
