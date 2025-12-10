# Deploy Edge Function to Supabase

## Option 1: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Click on "Edge Functions" in the left sidebar
4. Click "Create a new function"
5. Name it: `delete-mysql-members`
6. Copy the code from: `supabase/functions/delete-mysql-members/index.ts`
7. Paste it into the editor
8. Click "Deploy"

## Option 2: Using Supabase CLI (if you have it installed locally)

```bash
# Link your project
supabase link --project-ref auztoefiuddwerfbpcpm

# Deploy the function
supabase functions deploy delete-mysql-members

# Set the MySQL environment variables (if not already set)
supabase secrets set MYSQL_HOST=your_mysql_host
supabase secrets set MYSQL_USER=your_mysql_user
supabase secrets set MYSQL_PASSWORD=your_mysql_password
supabase secrets set MYSQL_DATABASE=your_mysql_database
```

## Option 3: Direct API Call (After deployment)

Once deployed, you can call it directly with:

```javascript
const { data, error } = await supabase.functions.invoke('delete-mysql-members');
console.log(data);
```

## Testing the Function

After deployment, visit: `/admin/delete-mysql-members` on your website to use the admin interface.
