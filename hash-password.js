const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function actualizarPassword() {
    try {
        const email = 'admin@scoredomino.com';
        const passwordTextoPlano = 'admin123';

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordTextoPlano, salt);

        console.log('Password hasheada:', passwordHash);

        // Actualizar en base de datos
        const [resultado] = await db.query(
            'UPDATE Usuarios SET Password = ? WHERE Email = ?',
            [passwordHash, email]
        );

        if (resultado.affectedRows > 0) {
            console.log('✅ Contraseña actualizada correctamente');
            console.log('Ahora puedes hacer login con:');
            console.log('Email:', email);
            console.log('Password:', passwordTextoPlano);
        } else {
            console.log('❌ No se encontró el usuario');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

actualizarPassword();
