import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update
from app.db.session import engine
from app.models.property import Property


async def check_properties():
    async with engine.begin() as conn:
        res = await conn.execute(
            select(
                Property.id,
                Property.property_code,
                Property.title,
                Property.price,
                Property.is_auction,
                Property.reserve_price,
                Property.auction_status,
                Property.auction_end_date,
            )
        )
        rows = res.fetchall()
        print(f"Total properties in DB: {len(rows)}")
        for r in rows:
            print(f"- [{r[1]}] {r[2]} | price={r[3]} | is_auction={r[4]} | reserve={r[5]} | status={r[6]}")

        # If no properties have is_auction=True, enable bidding on a few properties for testing!
        auction_count = sum(1 for r in rows if r[4] is True)
        if auction_count == 0 and len(rows) > 0:
            print("\nEnabling live auction on sample properties so buyers can bid immediately...")
            now = datetime.now(timezone.utc)
            end_date = now + timedelta(days=7)
            # Enable on first 2 properties
            for r in rows[:2]:
                await conn.execute(
                    update(Property)
                    .where(Property.id == r[0])
                    .values(
                        is_auction=True,
                        reserve_price=r[3],
                        auction_start_date=now,
                        auction_end_date=end_date,
                        min_bid_increment=1000.0,
                        auction_status="active",
                    )
                )
            print(f"Enabled live dynamic auction on properties: {rows[0][1]}, {rows[1][1] if len(rows) > 1 else ''}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check_properties())
