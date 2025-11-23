# Aiden Yang - Portfolio Website

A bilingual (EN/中文) portfolio website showcasing design and technology projects.

## Features

- 🎨 **Modern Design** - Clean, minimalist interface with smooth animations
- 🌐 **Bilingual** - Seamless switching between English and Chinese
- 💬 **AI Chatbot** - Interactive chatbot powered by Google Gemini API (integration pending)
- 📱 **Responsive** - Fully responsive across all devices
- ⚡ **Performance** - Optimized with GSAP animations and particle effects

## Projects

1. **CoLab** - Learning platform for international design students
2. **Vivid Sydney Hyper Experience** - Vision Pro spatial computing project
3. **ANNO** - Smart health companion system for older adults
4. **Whisperfield** - ADHD-focused immersive meditation experience

## Tech Stack

- HTML5 / CSS3 / JavaScript (ES6+)
- GSAP 3.12.2 (Animation)
- Canvas API (Particle Effects)
- Google Gemini API (AI Chatbot - pending integration)

## Local Development

1. Clone this repository
2. Open `index.html` in your browser
3. No build process required!

## Deployment

This site is designed for GitHub Pages deployment:

1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Select `main` branch as source
4. Your site will be live at `https://[username].github.io/[repository]`

## Customization

### Adding Gemini API Key

To enable the AI chatbot:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/)
2. In `script.js`, find the `AIChatbot` class
3. Set `this.apiKey = 'YOUR_API_KEY'`

### Changing Languages

All bilingual content uses `data-en` and `data-zh` attributes. To add new content:

```html
<element data-en="English Text" data-zh="中文文本">English Text</element>
```

## License

© 2024 Aiden Yang. All rights reserved.

## Contact

- Email: [your-email]
- LinkedIn: [your-linkedin]
- GitHub: [your-github]

---

Built with ❤️ by Aiden Yang
