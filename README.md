# 🎛️ BitTune — Graphic EQ DSP Controller

A hyper-realistic **sound system equalizer** web app for controlling the **Ampli-Smart DSP** hardware via Web Bluetooth (BLE).

Built with **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**.

![BitTune Preview](https://img.shields.io/badge/Status-Active-00e676?style=flat-square)

## ✨ Features

- **5 Vertical Faders** arranged side-by-side like a physical mixing console:
  - `HIGH` — Treble EQ (0–200, sends `[72, value]`)
  - `MID` — Midrange EQ (0–200, sends `[77, value]`)
  - `LOW` — Bass EQ (0–200, sends `[76, value]`)
  - `FX / ECHO` — Effects level (0–200, sends `[88, value]`)
  - `VOL` — Master volume (0–100, sends `[86, value]`)
- **Animated VU Meters** per channel (green → yellow → red LED segments)
- **Web Bluetooth** connection to ESP32-based DSP hardware
- **Dark mode** brushed-metal hardware aesthetic
- **Responsive** — works on mobile, tablet, and desktop
- **Touch-friendly** — designed for touchscreen interaction

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/iqbalhikam/bittune.git
cd bittune

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a **Chromium-based browser** (Chrome, Edge) for Web Bluetooth support.

## 🔧 BLE Protocol

| Control | ASCII Code | Byte Format       | Range   |
|---------|------------|--------------------|---------|
| HIGH    | `H` (72)   | `[72, value]`      | 0–200   |
| MID     | `M` (77)   | `[77, value]`      | 0–200   |
| LOW     | `L` (76)   | `[76, value]`      | 0–200   |
| FX      | `X` (88)   | `[88, value]`      | 0–200   |
| VOL     | `V` (86)   | `[86, value]`      | 0–100   |

**BLE UUIDs:**
- Service: `4fa8c820-1f87-11e9-ab14-d663bd873d93`
- Characteristic: `4a240bbd-26b7-48c7-9a3f-c151d3d45388`

## 🛠️ Tech Stack

- [Next.js 15](https://nextjs.org/) — React framework (App Router)
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first CSS
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) — BLE communication

## 📄 License

MIT
