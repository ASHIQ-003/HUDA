# HUDA - The Guidance 🕌

**HUDA** is a premium, beautifully designed, and highly optimized Islamic web application built for an immersive and spiritual user experience. 

Designed with modern UI/UX principles, glassmorphism, fluid animations, and a focus on accessibility, Huda provides an all-in-one suite of tools for the modern Muslim.

---

## ✨ Premium Features

*   **📖 The Holy Qur'an**
    *   Read the Qur'an with customizable Arabic fonts and beautiful translations (English & Tamil).
    *   **Continuous Recitation Player:** Seamless, gapless background audio streaming with lock-screen MediaSession integration.
    *   **Smart Bookmarking:** Save your progress. The app automatically remembers where you left off.
*   **📿 Advanced Tasbih (Dhikr)**
    *   An immersive, tactile Dhikr counter featuring haptic vibrations on every tap.
    *   Visual ripple animations and milestone goal tracking (33, 100, etc.).
*   **🧭 Interactive Qiblah Compass**
    *   A real-time, buttery-smooth compass that uses your device's gyroscope.
    *   Features a glowing alignment effect when you accurately face the Kaaba.
*   **🤲 Authentic Du'as & Adhkar**
    *   A massive, categorized library of authentic supplications (Morning, Evening, Travel, Distress, Restroom, Forgiveness, and more).
*   **✈️ Full Offline Support**
    *   Powered by a robust Service Worker caching engine. 
    *   Load the app instantly and access the Qur'an text and Du'as even on an airplane or with zero cell service.
*   **🌓 Adaptive UI**
    *   A stunning, luxury aesthetic featuring dark mode, subtle gold accents (`#d4af37`), and emerald gradients (`#10b981`).

---

## 🚀 Technologies Used

*   **HTML5 & CSS3:** Pure Vanilla CSS utilizing modern CSS variables for a robust design system. No heavy UI frameworks.
*   **Vanilla JavaScript:** Highly optimized, fast execution without the overhead of React or Vue.
*   **Service Workers (PWA):** Enabling fast, offline-first reliability.
*   **Web APIs:** `navigator.mediaSession` (background audio), `navigator.vibrate` (haptics), `deviceorientation` (compass).
*   **Third-Party APIs:** Integration with the Alquran.cloud API for Qur'an data.

---

## 🛠️ Setup & Local Development

This app requires zero build steps or package managers.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ASHIQ-003/HUDA.git
    cd HUDA
    ```
2.  **Serve locally:**
    Because the app uses modules and service workers, it must be run on a local server. You can use Python, Node, or any simple HTTP server:
    ```bash
    # Using Python
    python -m http.server 8000
    
    # Or using Node.js (http-server)
    npx http-server -p 8000
    ```
3.  **Open in browser:**
    Navigate to `http://localhost:8000`

---

## 📄 License

This project is built for the benefit of the Ummah. Feel free to use, share, and contribute.
