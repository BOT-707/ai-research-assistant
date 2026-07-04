# AI-Powered Company Research Assistant

A highly automated, AI-driven application designed to research companies and generate professional reports. Built for a 6-hour hiring hackathon, this application combines web crawling, Google Search (via Serper), and Large Language Models (via OpenRouter) to deliver a comprehensive analysis of any given company.

## 🌟 Features

- **Intelligent Discovery**: Enter just a company name, and the app automatically finds their official website, phone number, and address using the Google Knowledge Graph.
- **Automated Web Crawling**: A lightweight, custom-built crawler navigates the target website, extracting and cleaning relevant text while intelligently filtering out noise (like login pages or social media links).
- **Dynamic AI Analysis**: Choose from a variety of state-of-the-art LLMs powered by OpenRouter. The AI strictly formats its output into actionable business intelligence (Products, Services, Pain Points, and Competitors).
- **Competitor Enhancement**: If the AI suggests competitors but doesn't know their website, the system automatically runs parallel background searches to fill in the missing data.
- **Client-Side PDF Generation**: Download the final generated report as a clean, professionally formatted PDF.
- **Discord Integration**: Automatically submit generated reports (including the PDF file and Applicant details) directly to a Discord channel for review.
- **Real-Time Streaming UI**: Built with Next.js and Server-Sent Events (SSE), providing a ChatGPT-like responsive UI that streams progress updates step-by-step.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Vanilla CSS Modules (Custom Premium Dark Theme)
- **Search API**: [Serper.dev](https://serper.dev/)
- **AI API**: [OpenRouter](https://openrouter.ai/)
- **Crawler**: `axios` & `cheerio`
- **PDF Generation**: `jspdf` & `jspdf-autotable`

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:BOT-707/ai-research-assistant.git
cd ai-research-assistant
```
*(Note: If you are in the `relu` folder locally, you are already in the right place!)*

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables (Optional)

The application is designed so that you can input your API keys **directly into the UI Sidebar** for ease of use. However, if you want to hardcode them for local development, you can create a `.env.local` file in the root directory:

```env
# Create a free account at https://serper.dev
SERPER_API_KEY=your_serper_api_key_here

# Create a free account at https://openrouter.ai
OPENROUTER_API_KEY=your_openrouter_api_key_here
```
*(If you provide these in `.env.local`, you won't need to paste them into the UI every time).*

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎮 How to Use

1. **Configure Settings**: Open the app and look at the sidebar. If you haven't set `.env.local`, paste your OpenRouter and Serper API keys into the respective fields.
2. **Select an AI Model**: Choose your preferred LLM from the dropdown.
3. **Optional (Discord Integration)**: If you want the report sent to Discord automatically:
   - Provide your **Applicant Name** and **Applicant Email**.
   - Provide a **Discord Bot Token** and **Channel ID**.
4. **Start Researching**: In the bottom input bar, type a company name (e.g., `"Stripe"`) or paste a direct URL (e.g., `"https://stripe.com"`).
5. **Wait for Magic**: Watch the live progress indicators as the app searches, crawls, and generates the AI analysis.
6. **Download**: Click "Download PDF" once the report renders.

## 🏗️ Architecture Notes

- **`/api/research`**: The main orchestration endpoint. It manages the sequential pipeline of Serper -> Crawler -> OpenRouter -> Competitor Enhancement. It returns a `ReadableStream` to pipe Server-Sent Events to the client.
- **`/api/discord`**: A server-side proxy route that constructs a `multipart/form-data` request with the binary PDF Blob and pushes it to Discord, safely bypassing browser CORS restrictions.
- **Zero-DB**: The app is completely stateless. It does not require a database, making it incredibly fast and easy to deploy.
