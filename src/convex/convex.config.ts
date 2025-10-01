import { defineApp } from 'convex/server';
// import betterAuth from '@convex-dev/better-auth/convex.config';
import betterAuth from './betterAuth/convex.config';
import autumn from '@useautumn/convex/convex.config';

const app = defineApp();
app.use(betterAuth);
app.use(autumn);

export default app;
