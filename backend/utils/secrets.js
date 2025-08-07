require('dotenv').config(); 
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const getAndEncodeSecrets = async () => {
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
    const secretName = process.env.AWS_SECRET_NAME; // Tên secret được lưu trong biến môi trường
    const params = {
        SecretId: secretName,
    };

    try {
        const data = await client.send(new GetSecretValueCommand(params));

        if ('SecretString' in data) {
            const secret = JSON.parse(data.SecretString);
            return {
                accessKeyId: secret.ACCESS_KEY_ID,
                secretAccessKey: secret.SECRET_ACCESS_KEY,
            };
        } else {
            throw new Error('Secret does not contain a string value');
        }
    } catch (error) {
        console.error('Error getting secrets:', error);
        throw new Error('Unable to retrieve secrets');
    }
};

module.exports = { getAndEncodeSecrets };