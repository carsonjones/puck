export const getToken = (): string | null => {
	const token = process.env.NHL_TOKEN;
	return token && token.length > 0 ? token : null;
};
