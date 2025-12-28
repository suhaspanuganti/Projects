# 🏥 Intelligent Load-Balancing Framework for Fog-Enabled Healthcare Monitoring

This repository contains a **healthcare monitoring prototype inspired by fog computing principles**, designed to simulate real-time patient vital monitoring, clustering, and alerting.

The system models how patient data can be processed closer to the edge (fog layer) to reduce latency and enable faster response in healthcare applications.

---

## 📌 Project Overview

Modern healthcare systems rely on continuous data from IoT devices (heart rate monitors, glucose sensors, etc.).
Cloud-only architectures can introduce **latency and overload**.

This project demonstrates a **fog-enabled approach** by:

* Grouping patients into clusters
* Simulating real-time vital signs
* Processing data at cluster (fog/VM-like) level
* Triggering alerts when abnormal vitals are detected

---

## ⚙️ Features

* ✅ Real-time simulation of patient heart rate
* ✅ Blood glucose level simulation (main version)
* ✅ Patient clustering (fog-style grouping)
* ✅ Continuous monitoring loop
* ✅ SMS alert mechanism (Twilio – optional, configurable)
* ✅ Logging of abnormal vitals
* ✅ Simple VM / cluster abstraction (conceptual fog layer)

---

## 📂 Repository Structure

```
.
├── cloudgen.py          # Main fog-based healthcare monitoring program
├── generator.py         # Simpler prototype (heart-rate only)
├── suhas_report.pdf     # Final academic project report
├── README.md
├── requirements.txt
└── .gitignore
```

> ⚠️ Runtime-generated files such as logs and VM outputs are intentionally excluded from version control.

---

## 🧠 Code Description

### 🔹 `cloudgen.py` (Main Program)

* Simulates **heart rate and blood glucose**
* Divides patients into clusters (fog nodes)
* Processes data per cluster
* Logs abnormal conditions
* Sends SMS alerts (optional)
* Closest implementation to the **fog load-balancing concept**

### 🔹 `generator.py` (Optional / Simple Prototype)

* Heart-rate-only monitoring
* Easier to read and demonstrate
* Useful as an early or lightweight prototype

---

## 📊 Sample Output (Conceptual)

```
Cluster 7 | Anya | 24 | 95 bpm | Normal | 98 mg/dL | Normal
Cluster 7 | Saitama | 32 | 112 bpm | High | 104 mg/dL | Normal
```

Abnormal readings trigger alerts and are logged locally.

---

## 🔐 SMS Alerts (Optional)

The project supports SMS alerts using **Twilio**.

To enable:

1. Create a Twilio account
2. Set credentials as environment variables:

   ```
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   TWILIO_PHONE_NUMBER
   ```
3. Do **not** hardcode credentials in source files

SMS functionality is optional and can be disabled if not needed.

---

## 🚀 How to Run

### 1️⃣ Install dependencies

```bash
pip install -r requirements.txt
```

### 2️⃣ Run the main program

```bash
python cloudgen.py
```

The program will:

* Load patient data
* Form clusters
* Simulate vitals
* Continuously monitor patients

Press `CTRL + C` to stop.

---

## 📚 Academic Context

This project was developed as part of an academic submission titled:

**“Intelligent Load-Balancing Framework for Fog-Enabled Communication in Healthcare”**

The included PDF provides:

* Problem definition
* Literature survey
* Architecture diagrams
* Algorithm descriptions
* Discussion and future scope

---

## ⚠️ Disclaimer

* Patient data used in this project is **synthetic**
* Names and values are for demonstration only
* This is a **prototype**, not a production medical system

---

## 🔮 Future Enhancements

* Integrate real IoT sensor data
* Add true fog/edge node scheduling
* Web dashboard for monitoring
* Database-backed logging
* Machine learning–based anomaly detection

---

## 👤 Author

**Suhas Panuganti**
Bachelor of Engineering – Computer Science
Fog Computing | Healthcare Systems | Python


