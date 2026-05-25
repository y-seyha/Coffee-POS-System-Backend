export const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        domain: isProd ? '.coffeesteavpos.app' : undefined,
        path: '/',
    };
};