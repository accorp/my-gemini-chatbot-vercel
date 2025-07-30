// pages/api/chat.js
import { GoogleGenerativeAI } from '@google/generative-ai'; // <--- SUDAH DIPERBAIKI: menggunakan 'from'

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
  // Pilih model yang ingin Anda gunakan (misalnya 'gemini-pro' untuk teks)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  try {
    // Mulai sesi chat dengan riwayat yang diberikan
    const chat = model.startChat({
      history: history, // Kirim seluruh riwayat sebagai konteks
      // Anda bisa menambahkan generationConfig atau safetySettings di sini jika diperlukan
    });

    // Ambil pesan terakhir dari riwayat (pesan pengguna saat ini)
    // Pastikan ada pesan terakhir dan itu adalah pesan pengguna
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
    res.status(500).json({ message: 'Kesalahan saat memproses permintaan Anda.', error: error.message });
  }
}
