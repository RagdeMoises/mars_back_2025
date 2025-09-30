const xlsx = require('xlsx');
const path = require('path');
const pool = require('../config/database');
//const XLSX = require('xlsx');
const express = require('express');
//const router = express.Router();
const nodemailer = require('nodemailer');

const readExcelFile = async (filePath) => {
    try {
        const file = xlsx.readFile(filePath);            
        
        // Leer el archivo usando los encabezados reales de la primera fila
        const rawData = xlsx.utils.sheet_to_json(
            file.Sheets[file.SheetNames[0]], {
                header: 0, // Usar la primera fila como encabezados
                defval: "",
                range: 0
            });

        console.log('Encabezados detectados:', rawData.length > 0 ? Object.keys(rawData[0]) : []);
        
        // Mapear los datos a la estructura de la base de datos
        const mappedData = rawData.map(row => {
            return {
                
                sku: row['SKU'] || '',
                titulo: row['Nombre'] || '',
                stock: Number(row['Stock Disponible']) || Number(row['Stock']) || 0,
                precio_costo: Number(row['Costo Interno']) || 0,
                precio_minorista: Number(row['Precio Final']) || 0,
                precio_especial: Number(row['Precio']) || 0, // Precio sin IVA
                precio_mayorista: Number(row['Precio Mayorista']) || 0,
                categoria: row['Rubro'],
                proveedor: row['Proveedor'] || '',
                ubicacion: row['Ubicacion'] ||'', // No veo esta columna en el ejemplo
                estatus: row['etiqueta'] || row['Estado'] || '' // Usar etiqueta para estatus
            };
        }).filter(row => row.titulo && row.titulo.trim() !== '' && row.sku && row.sku !== '');

        console.log('Primera fila mapeada:', mappedData[0]);
        console.log('Total de registros procesados:', mappedData.length);
        
        return mappedData;
        
    } catch (err) {
        console.log('Error al leer el archivo Excel:', err);
        throw err;
    }
};

// const readExcelFile = async (filePath) => {
//     //console.log(filePath)
//     try {
//         const file = xlsx.readFile(filePath);            
//         let data = [];
//         const temp = xlsx.utils.sheet_to_json(
//             file.Sheets[file.SheetNames[0]], {
//                 header: ['barra', 'B', 'sku', 'id', 'titulo', 'F', 'stock', 'H', 'precio_costo', 'J', 
//                          'precio_minorista', 'L', 'precio_especial', 'N', 'precio_mayorista', 'P', 
//                          'Q', 'categoria', 'S', 'proveedor', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 
//                          'AB', 'AC', 'AD', 'AE', 'ubicacion', 'AG', 'AH', 'AI']
//             });
//         temp.forEach((res) => {  
//             console.log(res)          
//             data.push(res);
//         });
//         return data;
//     } catch (err) {
//         console.log(err);
//         throw err;
//     }
// };

const getProducts = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../../public/uploads/data.xlsx');
        const result = await readExcelFile(filePath);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// const renderExcelForm = (req, res) => {
//     res.render('index');
// };
const saveToDatabase = async (products) => {
    try {
        // Limpiar la tabla antes de insertar nuevos datos (opcional)
        await pool.query('TRUNCATE TABLE productos RESTART IDENTITY');
        
        // Insertar productos en lote
        for (const product of products) {
            console.log(product)
            await pool.query(
                `INSERT INTO productos (
                    sku, titulo, stock, precio_costo, 
                    precio_minorista, precio_especial, precio_mayorista, 
                    categoria, proveedor, ubicacion,estatus
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    product.sku,
                    product.titulo,
                    product.stock,
                    product.precio_costo,
                    product.precio_minorista,
                    product.precio_especial,
                    product.precio_mayorista,
                    product.categoria,
                    product.proveedor,
                    product.ubicacion,
                    product.AD
                ]
            );
        }
    } catch (err) {
        console.error('Error al guardar en la base de datos:', err);
        throw err;
    }
};

const uploadExcel = async(req, res) => {
    const filePath = path.join(__dirname, '../../public/uploads/data.xlsx');
    const result = await readExcelFile(filePath);
    await saveToDatabase(result);
    //console.log(result)
    res.send('uploaded');
};

const renderExcelForm = (req, res) => {
    res.send(`
        <h1>Upload Excel File</h1>
        <form action="/data/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="file" accept=".xlsx">
            <button type="submit">Upload</button>
        </form>
    `);
};

// Agregar esto en excel.controller.js
    const getPaginatedProducts = async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '',
                category = '',
                min_price = 0,
                max_price = 150000,
                sortBy = 'id',
                productTypes = ''
            } = req.query;
            
            //console.log(req.query);
            
            const offset = (page - 1) * limit;
            
            // Construir la parte WHERE de la consulta
            let whereConditions = ['(titulo ILIKE $1 OR sku ILIKE $1)'];
            const queryParams = [`%${search}%`];
            
            // Agregar filtro de categoría si existe
            if (category) {
                whereConditions.push('categoria = $' + (queryParams.length + 1));
                queryParams.push(category);
            }
            
            // Agregar filtro de rango de precios
            whereConditions.push('precio_minorista BETWEEN $' + (queryParams.length + 1) + ' AND $' + (queryParams.length + 2));
            queryParams.push(min_price, max_price);
            
            // Agregar filtro de tipo de producto si existe
            // if (productTypes) {

            //     whereConditions.push('estatus in ( $' + (queryParams.length + 1)+')');
            //     queryParams.push(productTypes);
            // }
            if (productTypes && typeof productTypes === 'string') {
                const productTypesArray = productTypes.split(',').map(p => p.trim());
                const placeholders = productTypesArray.map((_, i) => '$' + (queryParams.length + i + 1));                
                whereConditions.push(`estatus IN (${placeholders.join(', ')})`);
                queryParams.push(...productTypesArray);
            }


            //console.log(whereConditions)
            
            // Construir la consulta SQL
            let query = `
                SELECT * FROM productos
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY ${getSortClause(sortBy)}
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `;
            console.log(query)
            
            let countQuery = `
                SELECT COUNT(*) FROM productos
                WHERE ${whereConditions.join(' AND ')}
            `;
            
            // Agregar parámetros de paginación
            queryParams.push(limit, offset);
            
            // Ejecutar ambas consultas en paralelo
            const [productsResult, countResult] = await Promise.all([
                pool.query(query, queryParams),
                pool.query(countQuery, queryParams.slice(0, -2)) // Excluir limit y offset
            ]);
            
            const totalItems = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalItems / limit);
            
            res.json({
                data: productsResult.rows,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: parseInt(page),
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

// Función auxiliar para construir el ORDER BY
function getSortClause(sortBy) {
    //console.log(sortBy)
    switch(sortBy) {
        case 'price-asc':
            return 'precio_minorista ASC';
        case 'price-desc':
            return 'precio_minorista DESC';
        case 'name-asc':
            return 'titulo ASC';
        case 'name-desc':
            return 'titulo DESC';
        case 'newest':
            return 'id DESC';
        default:
            return `CASE
                WHEN estatus = 1 THEN 0
                WHEN estatus = 2 THEN 1
                ELSE 2
            END ASC`;
    }
}


const enviarCorreo = async (req, res) => {
  const { email, clientName, clientPhone, observations, cartItems } = req.body;
  //console.log(req.body)

  // Generar Excel
  const worksheet = xlsx.utils.json_to_sheet(cartItems);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Carrito");
  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  // Configurar transporte de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "edgararc13@gmail.com",
      pass: "ldpm ogab lgjk jnqa",
    },
    tls: {
        rejectUnauthorized: false, // ⚠️ Solo para pruebas
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
    if (clientPhone) subject += `Cel: ${clientPhone}`;
  }
  
  // Agregar observaciones al texto si existen
  if (observations) {
    text += `\n\nObservaciones: ${observations}`;
  }

  const mailOptions = {
    from: "edgararc13@gmail.com",
    to: email,
    //cc: 'coop.mars@outlook.com', // destinatario en copia
    cc: ['coop.mars@outlook.com', 'rivero_ragde@hotmail.com', 'santanaadri@hotmail.com'],
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
}
const getCategorias = async (req, res) => {

  try {
    const query = `
      SELECT categoria 
      FROM productos 
      GROUP BY categoria 
      ORDER BY categoria ASC
    `;
    const { rows } = await pool.query(query);
    //console.log(rows)
    res.json(rows.map(r => r.categoria)); // Solo enviamos el array de categorías
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const getNovedades = async (req, res) => {

  try {
    const query = `
      SELECT * 
      FROM productos 
	  where estatus = 1
      ORDER BY id desc
	  limit 4
    `;
    const { rows } = await pool.query(query);
    //console.log(rows)
    res.json(rows); // Solo enviamos el array de categorías
  } catch (error) {
    console.error('Error al obtener novedades:', error);
    res.status(500).json({ error: 'Error al obtener novedades' });
  }
};

const getOfertas = async (req, res) => {

  try {
    const query = `
      SELECT * 
      FROM productos 
	  where estatus = 2
      ORDER BY id desc
	  limit 4
    `;
    const { rows } = await pool.query(query);
    //console.log(rows)
    res.json(rows); // Solo enviamos el array de categorías
  } catch (error) {
    console.error('Error al obtener novedades:', error);
    res.status(500).json({ error: 'Error al obtener novedades' });
  }
};



module.exports = {
    getProducts,
    renderExcelForm,
    uploadExcel,
    getPaginatedProducts,
    enviarCorreo,
    getCategorias,
    getNovedades,
    getOfertas
};
