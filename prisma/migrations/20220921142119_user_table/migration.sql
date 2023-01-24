-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "game_favorit_id" TEXT NOT NULL,
    "tokem_notfication_mobile" TEXT NOT NULL,
    CONSTRAINT "User_game_favorit_id_fkey" FOREIGN KEY ("game_favorit_id") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
