# Mathi Collections – Shop Owner's Guide
### (Plain-English manual – no technical background needed)

This document explains what the software does and how you and your staff use it
every day. It is written for the owner, not for programmers.

---

## 1. What this system does

This is the one software for your whole shop. One login gives you:

| Area | What it is for |
|---|---|
| **Billing (POS)** | Make a bill quickly, take payment, print/auto-print the receipt |
| **Products** | Keep the full catalogue – every dress, size and colour |
| **Stock (Inventory)** | Know exactly how many pieces you have of every item, and get alerts when it is low or finished |
| **Purchases** | Record when you buy new stock from a supplier |
| **Suppliers** | Keep supplier details and see how much you still owe them |
| **Customers** | Keep customer details, credit balances and loyalty points |
| **Returns** | Handle returns of sold items and returns to suppliers |
| **Expenses** | Record rent, electricity, salary and other running costs |
| **Reports** | See your sales, profit and top-selling items |
| **Employees** | Create logins for your staff with limited powers |
| **Settings** | Your shop name, receipt size, tax, loyalty rules, etc. |

---

## 2. Who can use it (permissions)

There are **4 levels**. You decide who gets which.

| Level | In plain words |
|---|---|
| **Admin (you)** | Full control – everything, plus managing employees and settings |
| **Manager** | Can do almost everything except create employees and see the audit trail |
| **Cashier** | Can only do billing, sales, customers and view stock – **cannot** see reports or profit |
| **Staff** | View only – can look at products, stock and customers, cannot change anything important |

Rule of thumb: give Cashier/Staff the least power they need. Only **Admin** can open the Employees page.

---

## 3. The Dashboard (home screen)

When you log in you see today's summary at a glance:
- Sales and income **today**
- Number of bills / orders today
- Low-stock warnings
- Recent activity

---

## 4. Everyday billing (POS – Point of Sale)

This is the machine to make bills:

1. **Search** the item (name, or scan the barcode).
2. The item shows with its **size and colour** – pick the correct one (e.g. Kurti, Pink, M).
3. Set quantity, add discount if needed.
4. Pick the **customer** (existing, or quick-create a new one).
5. Take the money:
   - **Cash / UPI / Card / Bank Transfer** – full payment
   - **Credit** – customer pays later (only if you allow it). The software
     remembers how much they owe.
6. Bill is made, stock goes down by itself, and the **receipt prints**
   automatically (or you can turn auto-print off).

**Hold the bill:** If a customer says "I'll be back", press **Hold**. The items
are kept aside (stock is reserved). Later, from the **Held bills** list, just tap
**Complete** when the customer pays.

**Coupon:** You can apply an offer code like `DIWALI10` to give a discount.

**Loyalty points:** Regular customers earn points on every bill. You set the
rule in Settings. Points can be used for a discount later.

---

## 5. Products (your catalogue)

- Add a **product** (e.g. Anarkali Kurti) with its category, brand, material,
  purchase price and selling price.
- Then add **variants** – that means the same dress in different **sizes and
  colours**. Each size+colour is tracked separately, with its **own stock**.
- So "Kurti Pink M = 12 pieces" is different from "Kurti Pink L = 8 pieces".
- You can set a **minimum stock** level. When stock goes below it, you get an alert.
- Each variant can have its own **barcode** – useful for scanning at billing and
  printing **barcode labels**.

---

## 6. Stock / Inventory

- See the full stock list with the status of every item:
  - **In Stock** – fine
  - **Low Stock** – below your minimum, reorder soon
  - **Out of Stock** – sold out
- **Stock movements screen:** a complete diary of every piece that came in or went
  out (sale, purchase, return, adjustment) with before/after counts.
- **Adjust stock** (Admin/Manager only): fix stock after damage or counting
  mistakes, e.g. "add 2" or "remove 1" with a reason.
- Stock **updates automatically** – selling lowers it, purchases raise it, returns
  bring it back.

---

## 7. Purchases (buying from suppliers)

- Record a purchase: pick the supplier → add items → quantity and cost.
- You can pay fully or partially. The remaining amount becomes the **supplier due**.
- Stock **automatically increases** when the purchase is saved.
- **Purchase returns:** if some pieces are bad/faulty, return them – stock goes
  down and the amount is recorded.

---

## 8. Suppliers

- One page for all suppliers with contact details and their GST number.
- See how much you owe each supplier (`outstanding`).
- The system reminds you about supplier dues.

---

## 9. Customers

- Store customer details (phone, address).
- Tracks:
  - **Outstanding** – how much they still owe you (credit sales)
  - **Total purchases** – how much they have bought from you
  - **Loyalty points** – earned and available
- Search a customer instantly at billing, or quick-create on the spot.

---

## 10. Returns

**Sales return** (customer returns an item):
- Open the original sale and pick the items being returned.
- Choose the reason (size issue, defective, etc.).
- Choose what happens: **Refund** the money, give **Store Credit**, or **Exchange**.
- Stock automatically comes back in.

**Purchase return** (you return bad stock to the supplier):
- Stock goes down and the supplier due is adjusted.

---

## 11. Expenses

Record running costs: rent, electricity, salary, internet, transport,
maintenance, marketing, packaging, etc. Seen later in reports so you know your
real profit.

---

## 12. Coupons & offers

Create offer codes: flat amount or percentage off, with a minimum bill amount
and expiry date. Customers quote the code at billing.

---

## 13. Reports (see how the business is doing)

- **Sales report** – today / this week / this month / any date range, by category or status.
- **Profit report** – what you earned minus what the stock cost you.
- **Top products** – which dresses sell the most.
- **Payments report** – how much came via cash, UPI, card, credit.
- **Stock value** – what your current inventory is worth at cost.
- **Expenses report** – where your running costs go.

Print or screenshot these anytime for your own records.

---

## 14. Employees

- Add a staff login: name, email, password, and role (Manager/Cashier/Staff).
- **Reset a password** if someone forgets.
- **Deactivate** a login if someone leaves – they cannot log in anymore.

---

## 15. Settings (shop-level preferences)

One place where you configure your shop:
- Shop name, address, phone, GST number (printed on the receipt)
- Receipt size: **58mm / 80mm / A4** (thermal printer paper or full page)
- **Auto-print** the receipt after every bill (on/off)
- Allow **negative stock** or not (on/off)
- **Tax rate** if you apply GST
- **Loyalty rules**: points earned per rupee, points value, minimum to redeem
- Return policy and thank-you text printed on receipts

---

## 16. Notifications (the bell at the top)

A red number on the bell = something needs your attention:
- Low / out of stock items
- Customer pending or overdue payments
- Supplier dues
- Large returns

Click the bell to see them, mark as read after you act.

---

## 17. Audit trail (safety)

Every important action is recorded with who did it and when – logins, bills made,
bills cancelled, stock changes, price changes, settings changes. **Only Admin**
can view this. It helps you find mistakes and keep your staff accountable.

---

## 18. Good habits to follow

- Give staff **the lowest role** they truly need.
- Use **barcodes** for fast, mistake-free billing.
- Keep **minimum stock** values realistic so you get early alerts.
- Set **credit limits** mentally – the system tells you the outstanding, you
  decide who to trust.
- Check the **Dashboard** every morning and **Reports → Profit** every week.
- Change the admin password after first login (it comes from your `ADMIN_PASSWORD`
  setting; the Employees page lets you set passwords for every login).

---

## 19. Quick reference

| Item | Info |
|---|---|
| App address | https://textiles-billing-pos.onrender.com |
| Admin login | `admin@example.com` (password = the `ADMIN_PASSWORD` you set in Render) |
| Works on | Any computer / phone with internet + browser |
| Data safety | Your data lives in your own MongoDB cloud database (Atlas) |

---

## 20. One technical note (so you are not surprised)

The app needs **internet** (it is an online service, not installed on one PC). You
can open it from any device at the same address. If you ever stop the Render
service, the app goes offline but your data is always safe in your database.