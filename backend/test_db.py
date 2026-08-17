import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://neondb_owner:npg_GEwy51WAmHDJ@ep-long-waterfall-azzs0qit.c-3.ap-southeast-1.aws.neon.tech/neondb?ssl=require')
    rows = await conn.fetch('SELECT id, property_id, url FROM property_images LIMIT 10')
    for row in rows:
        print(dict(row))
    await conn.close()

asyncio.run(main())
