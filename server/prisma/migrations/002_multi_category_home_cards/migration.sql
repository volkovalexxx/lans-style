-- ProductCategory junction table
CREATE TABLE IF NOT EXISTS "ProductCategory" (
  "productId" INTEGER NOT NULL,
  "categoryId" INTEGER NOT NULL,
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId", "categoryId"),
  CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- HomeCategoryCard table
CREATE TABLE IF NOT EXISTS "HomeCategoryCard" (
  "id" SERIAL NOT NULL,
  "position" INTEGER NOT NULL,
  "categoryId" INTEGER,
  "imageUrl" TEXT,
  "imageSource" TEXT NOT NULL DEFAULT 'latest',
  CONSTRAINT "HomeCategoryCard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HomeCategoryCard_position_key" UNIQUE ("position"),
  CONSTRAINT "HomeCategoryCard_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Seed default 5 cards if not already present
INSERT INTO "HomeCategoryCard" ("position", "imageSource")
SELECT s.pos, 'latest'
FROM (VALUES (0),(1),(2),(3),(4)) AS s(pos)
WHERE NOT EXISTS (SELECT 1 FROM "HomeCategoryCard" WHERE "position" = s.pos);
