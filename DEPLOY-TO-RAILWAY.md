# 🚂 Deploy Your WMS to Railway

## Super Easy Deployment Steps (5 minutes!)

### **Option 1: Deploy from Folder** (Easiest - No Git needed!)

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Click "Login" (use GitHub, Google, or Email)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo" OR "Empty Project"

3. **If using Empty Project:**
   - After creating project, click "Deploy from GitHub repo"
   - OR use Railway CLI (see Option 2 below)

4. **Configure (Railway does this automatically!)**
   - Railway detects your `package.json`
   - Automatically runs `npm install`
   - Automatically runs `npm start`
   - Your app goes live! 🎉

5. **Get Your URL**
   - Click "Settings" → "Generate Domain"
   - You'll get a URL like: `your-wms.up.railway.app`
   - Share this URL with anyone!

### **Option 2: Deploy with Railway CLI** (Even Faster!)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Deploy Your App**
   ```bash
   railway init
   railway up
   ```

4. **Open Your App**
   ```bash
   railway open
   ```

That's it! Your WMS is now live! 🚀

---

## **After Deployment**

### Get Your Live URL:
1. Go to your Railway dashboard
2. Click your project
3. Click "Settings" tab
4. Under "Domains" → Click "Generate Domain"
5. Copy the URL (e.g., `wms-production-abc123.up.railway.app`)

### Share with Others:
Just send them the Railway URL! They can:
- ✅ View all the data
- ✅ Filter orders
- ✅ Use all features
- ✅ No login required (unless you add auth later)

---

## **Updating Your Deployed App**

When you make changes locally:

### Using Railway CLI:
```bash
railway up
```

### Using GitHub:
1. Push changes to GitHub
2. Railway auto-deploys! (if connected to GitHub)

---

## **Important Notes**

### ✅ What Works Out of the Box:
- All your WMS features
- NetSuite data from `sample-data.json`
- All 4 pages (Singles, Bulk, High Volume, Unique Orders)
- Filters and search
- Process Singles button

### 🔒 Security Considerations:
Your app is **PUBLIC** by default. Anyone with the URL can access it.

**To add password protection later:**
1. Add simple authentication
2. Use Railway's environment variables for credentials
3. Or use Railway's private networking

### 💰 Pricing:
- **Free tier**: $5 credit/month (usually enough for demos)
- Your app uses minimal resources
- Sleeps after 30 min of inactivity (wakes up instantly when accessed)

---

## **Troubleshooting**

### If deployment fails:
1. Check Railway logs: Click "Deployments" → Click the deployment → View logs
2. Make sure `sample-data.json` is in your project
3. Verify `npm install` works locally

### If app doesn't load:
1. Check if it's using correct PORT
2. Railway sets PORT automatically (your code already handles this!)
3. Check logs for errors

### Need help?
- Railway docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: Very helpful community

---

## **Quick Checklist**

Before deploying, make sure you have:
- ✅ `package.json` (has your dependencies)
- ✅ `index.js` (your server file)
- ✅ `sample-data.json` (your NetSuite data)
- ✅ `public/` folder (your web interface)

All set! You're ready to deploy! 🎉

---

## **Alternative: If Railway Doesn't Work**

### Try Render.com (also free):
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub or upload files
4. Render auto-detects everything
5. Click "Create Web Service"
6. Done!

### Try Fly.io:
1. Install: `npm install -g flyctl`
2. Login: `fly auth login`
3. Deploy: `fly launch`
4. Follow prompts
5. Done!

---

**The Railway URL you get will look like:**
```
https://wms-production-abc123.up.railway.app
```

**Share this URL** and anyone can access your WMS! 🚀



