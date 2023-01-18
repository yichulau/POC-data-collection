"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnect = void 0;
const mysql2_1 = __importDefault(require("mysql2"));
const connectionString = process.env.DATABASE_URL || '';
const connection = mysql2_1.default.createConnection(connectionString);
exports.dbConnect = {
    createDBConnection
};
function createDBConnection() {
    return mysql2_1.default.createConnection(connectionString);
}
//# sourceMappingURL=db.js.map