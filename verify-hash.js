const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verify() {
    const hash = '$2b$10$7IUaL.lsvu3Y9QbiWAYcMO5YN.QgVat.J.utnUi4wM99B1/DESoFC';
    const passwords = ['password123', 'admin123', '123456', 'kikoba2024'];
    
    for (const pw of passwords) {
        const match = await bcrypt.compare(pw, hash);
        console.log(`Password: ${pw}, Match: ${match}`);
    }
}

verify();
