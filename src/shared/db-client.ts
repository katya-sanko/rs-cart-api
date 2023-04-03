import { Client, QueryResult } from 'pg';


const options = {
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT),
	database: process.env.DB_NAME,
	user: process.env.DB_USER_NAME,
	password: process.env.DB_PASS,
	ssl: {
		rejectUnauthorized: false,
	},
	connectionTimeoutMillis: 10000,
};

export const dbClient = async (queryString: string) => {
	const newConnection = new Client(options);
	let output: QueryResult;

	await newConnection.connect();

	try {
		output = await newConnection.query(queryString);
	} catch (err) {
		console.log(err);
		return err;
	} finally {
		await newConnection.end();
	}

	return output;
};
