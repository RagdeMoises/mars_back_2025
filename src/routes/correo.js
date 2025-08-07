// En tu backend (ejemplo con Express)
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');

router.post('/send-cart', async (req, res) => {
  const { email, clientName, clientPhone, observations, cartItems } = req.body;

  // Generar Excel
  const worksheet = XLSX.utils.json_to_sheet(cartItems);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Carrito");
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  // Configurar transporte de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Construir subject y text basado en los datos proporcionados
  let subject = 'MARS- Tu carrito de pedidos';
  let text = 'Adjunto encontrarás los productos de tu carrito';
  
  // Agregar nombre y teléfono al subject si existen
  if (clientName || clientPhone) {
    subject += ' - ';
    if (clientName) subject += `Cliente: ${clientName}`;
    if (clientName && clientPhone) subject += ' - ';
    if (clientPhone) subject += `Tel: ${clientPhone}`;
  }
  
  // Agregar observaciones al texto si existen
  if (observations) {
    text += `\n\nObservaciones: ${observations}`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || "edgararc13@gmail.com",
    to: email,
    subject: subject,
    text: text,
    attachments: [{
      filename: 'carrito.xlsx',
      content: excelBuffer,
    }],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Correo enviado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar el correo' });
  }
});
