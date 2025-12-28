# 🤖 AI Smart Reader / GenAI Screen Reader

### Intelligent Web Accessibility Assistant using NLP, OCR & Voice Navigation

## 📌 Project Overview

**AI Smart Reader** (also referred to as **GenAI Screen Reader**) is a browser-based accessibility tool designed to help **visually impaired users** and **fast readers** consume web content more efficiently.

The system intelligently extracts meaningful text from webpages, summarizes content using **Natural Language Processing (NLP)**, performs **OCR on images**, and provides **voice-based navigation and text-to-speech (TTS)** output through an interactive overlay interface.

This project focuses on improving **web accessibility**, **content comprehension**, and **hands-free navigation**.

---

## ✨ Key Features

* **Intelligent Content Extraction**
  Extracts meaningful text while ignoring ads, clutter, and irrelevant DOM elements.

* **AI-Powered Summarization (NLP)**
  Generates concise summaries and priority-based content views.

* **Text-to-Speech Narration (TTS)**
  Converts extracted and summarized content into natural voice output.

* **Hover-to-Read Interaction**
  Reads content aloud when users hover over text elements.

* **Voice Navigation**
  Enables hands-free control using speech recognition and fuzzy matching.

* **Interactive Element Detection**
  Identifies buttons, links, and important UI elements for accessibility.

* **OCR Integration**
  Extracts text from images and image-based content.

* **Page Summary Mode**
  Provides full-page and priority-only summaries for quick understanding.

---

## 🧠 System Architecture

The system follows a modular, layered architecture:

1. **Content Capture Layer**

   * DOM extraction
   * OCR for image-based text

2. **NLP Layer**

   * Text cleaning
   * Summarization
   * Semantic matching

3. **Voice Interaction Layer**

   * Speech recognition
   * Fuzzy search for commands

4. **Output Layer**

   * Text-to-Speech (TTS)
   * Overlay UI for previews

5. **Browser Extension Shell**

   * Chrome Extension (Manifest V3)

---

## 🔄 Workflow

```
Extract → Clean → Summarize → Preview Overlay → TTS  
→ User Interaction → OCR Support → Voice Navigation
```

---

## ⌨️ Keyboard & Voice Controls

| Action                     | Control            |
| -------------------------- | ------------------ |
| Page summary               | `P`                |
| Priority-only summary      | `Shift + P`        |
| Priority marking           | `1 / 2 / 3`        |
| Pause / Resume TTS         | `Space`            |
| Stop TTS                   | `ESC`              |
| Re-summarize page          | `Ctrl + Shift + A` |
| Activate voice recognition | `V`                |

---

## 🧪 Installation (Chrome Extension)

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the project directory

---

## 🎥 Demo & Output Notes

* A **demo video** showcasing the system’s behavior is available on the portfolio website.
* Some AI-generated outputs may **not be visible** in the current setup because the **OpenAI API key used during development was disabled** after being exposed online.
* Please refer to the demo video for a complete demonstration of functionality.

---

## 🛠️ Technologies Used

* Natural Language Processing (NLP)
* OCR (Optical Character Recognition)
* Text-to-Speech (TTS)
* Speech Recognition
* Browser Extension APIs (Chrome, Manifest V3)
* Web-based UI overlays

---

## 🎯 Use Cases

* Web accessibility for visually impaired users
* Hands-free content navigation
* Rapid content consumption for fast readers
* Assistive technology research and prototyping

---

## ⚠️ Disclaimer

* This project was developed as an **academic + exploratory effort**
* It is a **prototype**, not a production-grade assistive tool
* Source code and assets are provided **for reference and demonstration purposes**

---

## 👤 Author

**Suhas Panuganti**
Aspiring Full Stack Developer | Generative AI & Accessibility Enthusiast

---


