
import * as bcrypt from 'bcrypt';

async function generateHash() {
    const password = '123456';

    const hash = await bcrypt.hash(password, 10);

    console.log('Password:', password);
    console.log('Hash:', hash);
}

generateHash();