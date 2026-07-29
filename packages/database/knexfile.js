"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
// Load env from the api app's .env when running migrations standalone
dotenv.config({ path: (0, path_1.resolve)(process.cwd(), '../../apps/api/.env') });
const config = {
    client: 'mysql2',
    connection: {
        host: process.env['DB_HOST'] ?? 'localhost',
        port: Number(process.env['DB_PORT'] ?? 3306),
        user: process.env['DB_USER'] ?? 'root',
        password: process.env['DB_PASSWORD'] ?? '',
        database: process.env['DB_NAME'] ?? 'ecommerce',
        timezone: 'UTC',
        charset: 'utf8mb4',
    },
    pool: {
        min: 2,
        max: 10,
    },
    migrations: {
        directory: './migrations',
        extension: 'ts',
        loadExtensions: ['.ts'],
    },
    seeds: {
        directory: './seeds',
        extension: 'ts',
        loadExtensions: ['.ts'],
    },
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map