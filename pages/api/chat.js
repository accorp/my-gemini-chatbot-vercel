// pages/api/chat.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Pastikan hanya menerima permintaan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Menerima seluruh riwayat percakapan dari frontend
  const { history } = req.body;

  // Validasi riwayat
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ message: 'Riwayat percakapan diperlukan dan harus berupa array.' });
  }

  // Penting: Gunakan variabel lingkungan untuk kunci API
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY tidak ditemukan di variabel lingkungan.');
    return res.status(500).json({ message: 'Kunci API Gemini tidak dikonfigurasi.' });
  }

  // Inisialisasi Gemini API
  const genAI = new GoogleGenerativeAI(apiKey);
  // Pilih model yang ingin Anda gunakan (gemini-2.5-flash-preview-05-20)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  // Konfigurasi generasi untuk mengontrol output model
  const generationConfig = {
    temperature: 0.7, // Mengontrol kreativitas. Nilai lebih rendah (0-1) membuat respons lebih fokus dan deterministik.
    topP: 0.95,       // Mengontrol keragaman. Nilai lebih rendah membuat respons lebih spesifik.
    topK: 60,         // Mengontrol keragaman. Nilai lebih rendah membatasi pilihan kata.
    maxOutputTokens: 1024, // Membatasi panjang respons untuk mencegah balasan yang terlalu panjang.
  };

  // Pengaturan keamanan untuk memfilter konten yang tidak pantas
  const safetySettings = [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ];

  try {
    // Mulai sesi chat dengan riwayat yang diberikan dan konfigurasi baru
    const chat = model.startChat({
      history: history, // Kirim seluruh riwayat sebagai konteks
      generationConfig: generationConfig, // Terapkan konfigurasi generasi
      safetySettings: safetySettings,   // Terapkan pengaturan keamanan
      // Instruksi sistem untuk memandu perilaku model
      systemInstruction: "Anda adalah asisten AI yang ramah dan membantu. Selalu berikan respons dalam Bahasa Indonesia yang jelas dan informatif. Gunakan format Markdown untuk keterbacaan yang lebih baik jika sesuai.", // <--- BARIS INI DITAMBAHKAN
    });

    // Ambil pesan terakhir dari riwayat (pesan pengguna saat ini)
    const lastUserMessage = history[history.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user' || !lastUserMessage.parts || lastUserMessage.parts.length === 0) {
      return res.status(400).json({ message: 'Pesan pengguna terakhir tidak valid dalam riwayat.' });
    }

    // Kirim pesan terakhir ke model Gemini dalam konteks chat
    const result = await chat.sendMessage(lastUserMessage.parts[0].text);
    const response = await result.response;
    const text = response.text(); // Dapatkan teks respons

    // Kirim respons bot kembali ke frontend dalam format yang sesuai dengan chat history
    res.status(200).json({ reply: { role: 'model', parts: [{ text: text }] } });
  } catch (error) {
    console.error('Kesalahan saat memanggil Gemini API:', error);
    // Tangani kesalahan dan kirim respons kesalahan
    // Periksa apakah error adalah akibat dari safety settings
    if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason) {
      return res.status(400).json({ message: `Konten diblokir karena: ${error.response.promptFeedback.blockReason}. Silakan coba pertanyaan lain.` });
    }
    res.status(500).json({ message: 'Kesalahan saat memproses permintaan Anda.', error: error.message });
  }
}
