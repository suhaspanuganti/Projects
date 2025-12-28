# 🏥 Intelligent Load-Balancing Framework for Fog-Enabled Healthcare Monitoring

This repository contains a **fog-computing–inspired healthcare monitoring system** that simulates real-time patient vital monitoring, clustering, and load-balanced processing across virtual machines (VMs).

The project demonstrates how **fog/edge-level processing** can reduce latency and distribute computational load for healthcare IoT applications.

---

## 📌 Project Description

Traditional cloud-centric healthcare systems can suffer from:

* High latency
* Network congestion
* Centralized overload

This project models a **fog-enabled approach** by:

* Grouping patients into clusters
* Processing patient data at VM (fog node) level
* Monitoring vital signs continuously
* Logging abnormal health conditions
* Demonstrating load distribution across VMs

The system is **simulation-based** and intended for **academic and demonstration purposes**.

---

## ⚙️ Key Features

* Real-time **heart-rate simulation**
* Blood-glucose simulation (main version)
* Patient clustering (fog-style grouping)
* VM-level load distribution
* Continuous monitoring loop
* Abnormal vital detection
* SMS alert support (optional, configurable)
* Runtime logging of health events

---

## 📂 Repository Structure

```
.
├── Load Balancer Results/
│   ├── vm1_results.txt
│   ├── vm2_results.txt
│   └── vm3_results.txt
│
├── Outputs/
│   └── health_logs.txt
│
├── cloudgen.py
├── generator.py
└── suhas report.pdf
```

---

## 📁 Folder Explanation

### 🔹 `Load Balancer Results/`

Contains **sample VM-level output files** generated during execution.

* Each file represents processing performed by a simulated fog/VM node
* Demonstrates how workload is distributed across multiple nodes
* Files are included **only as sample outputs for demonstration**

---

### 🔹 `Outputs/`

Contains consolidated runtime logs.

* `health_logs.txt` records abnormal health events
* Used to demonstrate alerting and monitoring behavior
* Included as a **sample execution snapshot**

> In a production environment, these outputs would be generated dynamically and excluded from version control.

---

## 🧠 Code Overview

### 🔸 `cloudgen.py` (Main Program)

* Simulates **heart rate and blood glucose**
* Reads patient data from Excel
* Divides patients into clusters
* Processes clusters through VM-like logic
* Logs abnormal vitals
* Sends SMS alerts (optional)
* Closest implementation of the **fog load-balancing concept**

Run this file for the **full project behavior**.

---

### 🔸 `generator.py` (Simpler Prototype)

* Heart-rate-only simulation
* Simpler clustering logic
* Useful for understanding the core monitoring flow
* Acts as an early / lightweight prototype

---

## ▶️ How to Run

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
* Simulate vitals continuously
* Log abnormal events
* Generate VM-level output files

Stop execution with:

```
CTRL + C
```

---

## 🔐 SMS Alert Support (Optional)

The system supports SMS alerts using **Twilio**.

To enable alerts:

* Configure Twilio credentials as environment variables:

  ```
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_PHONE_NUMBER
  ```
* SMS functionality is optional and can be disabled if not required

No credentials are hard-coded in the repository.

---

## 📊 Sample Output (Conceptual)

```
Cluster 7 | Saitama | 32 | Heart Rate: 112 (High) | Glucose: 98 (Normal)
Cluster 7 | Anya    | 24 | Heart Rate: 95 (Normal) | Glucose: 102 (Normal)
```

Abnormal values are logged and optionally trigger alerts.

---

## 📚 Academic Context

This project was developed as part of an academic submission titled:

**“Intelligent Load-Balancing Framework for Fog-Enabled Communication in Healthcare”**

The included PDF (`suhas report.pdf`) contains:

* Problem statement
* Literature survey
* System architecture
* Algorithm design
* Discussion and future scope

---

## ⚠️ Disclaimer

* All patient data used is **synthetic**
* Names and values are for demonstration only
* This system is a **prototype**, not a production medical solution

---

## 🔮 Future Enhancements

* Integration with real IoT sensor data
* True fog/edge node scheduling
* Web-based monitoring dashboard
* Database-backed logging
* ML-based anomaly detection

---

## 👤 Author

**Suhas Panuganti**
Bachelor of Engineering – Computer Science
Fog Computing | Healthcare Systems | Python

---
