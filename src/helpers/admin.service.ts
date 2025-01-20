import * as fs from 'fs';
import { logger } from './logger';

export class AdminService {
    private static instance: AdminService;
    private readonly admins: number[] = [];
    private path = 'admin.json';

    private constructor() {
        try {
            const adminsFile = fs.readFileSync(this.path, 'utf8');
            this.admins = JSON.parse(adminsFile);
        } catch (e) {
            console.log('Error reading file:', e);
            console.log(e);
        }
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }

        this.instance = new AdminService();
        return this.instance;
    }

    getAdmins() {
        return this.admins;
    }

    addAdmin(id: number) {
        if (this.admins.includes(id)) return;

        this.admins.push(id);
        const adminsJson = JSON.stringify(this.admins);

        this.saveJson(adminsJson);
    }

    deleteAdmin(id: number) {
        const index = this.admins.indexOf(id);
        if (index !== -1) {
            this.admins.splice(index, 1);
        }

        const adminsJson = JSON.stringify(this.admins);
        this.saveJson(adminsJson);
    }

    isAdmin(id: number): boolean {
        return this.admins.includes(id);
    }
    
    private saveJson(json: string) {
        fs.writeFile(this.path, json, (err) => {
            if (err) {
                logger.info('Error writing file:', err);
                console.log('Error writing file:', err);
            } else {
                logger.info('Successfully wrote file');
                console.log('Successfully wrote file');
            }
        });
    }
}