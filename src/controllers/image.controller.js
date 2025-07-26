exports.uploadImage = (req, res) => {
    res.send('uploaded');
};

exports.uploadImages = (req, res) => {
    res.send('uploaded');
};

exports.uploadExcel = (req, res) => {
    res.send('uploaded');
};

exports.renderImageForm = (req, res) => { 
    res.send(`
        <h1>Upload Image</h1>
        <form action="/image/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="image" accept="image/*">
            <button type="submit">Upload</button>
        </form>
    `);
    
};

exports.renderExcelForm = (req, res) => {
     res.send(`
        <h1>Upload Excel File</h1>
        <form action="/data/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="file" accept=".xlsx">
            <button type="submit">Upload</button>
        </form>
    `);
};


exports.renderImagesForm = (req, res) => { 
    res.send(`
        <h1>Upload Image</h1>
        <form action="/images/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="images" accept="image/*" multiple>
            <button type="submit">Upload</button>
        </form>
    `);
    
};