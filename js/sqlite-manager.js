/**
 * SQLite Manager para MicroSEAL
 * Gerencia persistência de dados usando SQL.js e IndexedDB
 */

class SQLiteManager {
    constructor() {
        this.db = null;
        this.SQL = null;
        this.dbName = 'microseal_data.sqlite';
        this.initialized = false;
    }

    /**
     * Inicializa o SQL.js e carrega/cria o banco de dados
     */
    async initialize() {
        try {
            // Inicializar SQL.js
            const sqlPromise = initSqlJs({
                locateFile: file => `libs/${file}`
            });
            this.SQL = await sqlPromise;

            // Tentar carregar banco existente do IndexedDB
            const existingData = await this.loadFromIndexedDB();
            
            if (existingData) {
                // Carregar banco existente
                this.db = new this.SQL.Database(existingData);
                console.log('Banco SQLite existente carregado com sucesso');
            } else {
                // Criar novo banco
                this.db = new this.SQL.Database();
                await this.createTables();
                console.log('Novo banco SQLite criado com sucesso');
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Erro ao inicializar SQLite:', error);
            return false;
        }
    }

    /**
     * Cria as tabelas necessárias no banco
     */
    async createTables() {
        const createSensorDataTable = `
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                voltage REAL,
                temperature_c REAL,
                temperature_f REAL,
                humidity REAL,
                dew_point_c REAL,
                dew_point_f REAL,
                converted_value REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createLogsTable = `
            CREATE TABLE IF NOT EXISTS communication_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                direction TEXT NOT NULL,
                message TEXT NOT NULL,
                device_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createIndexes = `
            CREATE INDEX IF NOT EXISTS idx_sensor_data_device_timestamp ON sensor_data(device_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp);
            CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON communication_logs(timestamp);
        `;

        this.db.run(createSensorDataTable);
        this.db.run(createLogsTable);
        this.db.run(createIndexes);

        console.log('Tabelas criadas com sucesso');
    }

    /**
     * Carrega dados do IndexedDB
     */
    async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MicroSEAL_DB', 1);
            
            request.onerror = () => resolve(null);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['sqlite_data'], 'readonly');
                const objectStore = transaction.objectStore('sqlite_data');
                const getRequest = objectStore.get(this.dbName);
                
                getRequest.onsuccess = () => {
                    resolve(getRequest.result ? getRequest.result.data : null);
                };
                
                getRequest.onerror = () => resolve(null);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('sqlite_data')) {
                    db.createObjectStore('sqlite_data', { keyPath: 'name' });
                }
            };
        });
    }

    /**
     * Salva dados no IndexedDB
     */
    async saveToIndexedDB() {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const data = this.db.export();
            const request = indexedDB.open('MicroSEAL_DB', 1);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['sqlite_data'], 'readwrite');
                const objectStore = transaction.objectStore('sqlite_data');
                
                objectStore.put({
                    name: this.dbName,
                    data: data,
                    lastModified: new Date().toISOString()
                });
                
                transaction.oncomplete = () => resolve(true);
                transaction.onerror = () => resolve(false);
            };
            
            request.onerror = () => resolve(false);
        });
    }

    /**
     * Insere dados do sensor no banco
     */
    async insertSensorData(deviceId, sensorData) {
        if (!this.initialized || !this.db) return false;

        try {
            const stmt = this.db.prepare(`
                INSERT INTO sensor_data (
                    device_id, timestamp, voltage, temperature_c, temperature_f, 
                    humidity, dew_point_c, dew_point_f, converted_value
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // Calcular valor convertido
            let convertedValue = null;
            if (sensorData.voltage !== undefined) {
                if (deviceId === 1 || deviceId === 2) {
                    convertedValue = this.convertPressure(deviceId, sensorData.voltage);
                } else if (deviceId === 3) {
                    convertedValue = this.convertDistance(sensorData.voltage);
                } else {
                    convertedValue = sensorData.voltage;
                }
            }

            stmt.run([
                deviceId,
                sensorData.timestamp || new Date().toISOString(),
                sensorData.voltage || null,
                sensorData.temperatureC || null,
                sensorData.temperatureF || null,
                sensorData.humidity || null,
                sensorData.dewPointC || null,
                sensorData.dewPointF || null,
                convertedValue
            ]);

            stmt.free();
            
            // Salvar no IndexedDB periodicamente (a cada 10 inserções)
            if (Math.random() < 0.1) {
                await this.saveToIndexedDB();
            }

            return true;
        } catch (error) {
            console.error('Erro ao inserir dados do sensor:', error);
            return false;
        }
    }

    /**
     * Insere log de comunicação no banco
     */
    async insertCommunicationLog(direction, message, deviceId = null) {
        if (!this.initialized || !this.db) return false;

        try {
            const stmt = this.db.prepare(`
                INSERT INTO communication_logs (timestamp, direction, message, device_id)
                VALUES (?, ?, ?, ?)
            `);

            stmt.run([
                new Date().toISOString(),
                direction,
                message,
                deviceId
            ]);

            stmt.free();
            return true;
        } catch (error) {
            console.error('Erro ao inserir log:', error);
            return false;
        }
    }

    /**
     * Consulta dados do sensor por período
     */
    getSensorData(deviceId = null, startDate = null, endDate = null) {
        if (!this.initialized || !this.db) return [];

        try {
            let query = 'SELECT * FROM sensor_data WHERE 1=1';
            const params = [];

            if (deviceId !== null) {
                query += ' AND device_id = ?';
                params.push(deviceId);
            }

            if (startDate) {
                query += ' AND timestamp >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND timestamp <= ?';
                params.push(endDate);
            }

            query += ' ORDER BY timestamp ASC';

            const stmt = this.db.prepare(query);
            const result = stmt.all(params);
            stmt.free();

            return result;
        } catch (error) {
            console.error('Erro ao consultar dados do sensor:', error);
            return [];
        }
    }

    /**
     * Consulta logs de comunicação
     */
    getCommunicationLogs(startDate = null, endDate = null) {
        if (!this.initialized || !this.db) return [];

        try {
            let query = 'SELECT * FROM communication_logs WHERE 1=1';
            const params = [];

            if (startDate) {
                query += ' AND timestamp >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND timestamp <= ?';
                params.push(endDate);
            }

            query += ' ORDER BY timestamp ASC';

            const stmt = this.db.prepare(query);
            const result = stmt.all(params);
            stmt.free();

            return result;
        } catch (error) {
            console.error('Erro ao consultar logs:', error);
            return [];
        }
    }

    /**
     * Limpa dados antigos (mantém apenas os últimos X dias)
     */
    async cleanOldData(daysToKeep = 30) {
        if (!this.initialized || !this.db) return false;

        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const cutoffIso = cutoffDate.toISOString();

            this.db.run('DELETE FROM sensor_data WHERE timestamp < ?', [cutoffIso]);
            this.db.run('DELETE FROM communication_logs WHERE timestamp < ?', [cutoffIso]);

            await this.saveToIndexedDB();
            console.log(`Dados anteriores a ${cutoffDate.toLocaleDateString()} removidos`);
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
            return false;
        }
    }

    /**
     * Limpa todos os dados
     */
    async clearAllData() {
        if (!this.initialized || !this.db) return false;

        try {
            this.db.run('DELETE FROM sensor_data');
            this.db.run('DELETE FROM communication_logs');
            await this.saveToIndexedDB();
            console.log('Todos os dados foram limpos');
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            return false;
        }
    }

    /**
     * Força salvamento no IndexedDB
     */
    async forceSave() {
        return await this.saveToIndexedDB();
    }

    /**
     * Obtém estatísticas do banco
     */
    getStatistics() {
        if (!this.initialized || !this.db) return null;

        try {
            const sensorCount = this.db.exec('SELECT COUNT(*) as count FROM sensor_data')[0];
            const logCount = this.db.exec('SELECT COUNT(*) as count FROM communication_logs')[0];
            const devices = this.db.exec('SELECT DISTINCT device_id FROM sensor_data ORDER BY device_id')[0];
            const dateRange = this.db.exec(`
                SELECT 
                    MIN(timestamp) as first_record,
                    MAX(timestamp) as last_record
                FROM sensor_data
            `)[0];

            return {
                sensorRecords: sensorCount ? sensorCount.values[0][0] : 0,
                logRecords: logCount ? logCount.values[0][0] : 0,
                activeDevices: devices ? devices.values.map(row => row[0]) : [],
                firstRecord: dateRange && dateRange.values[0][0] ? dateRange.values[0][0] : null,
                lastRecord: dateRange && dateRange.values[0][1] ? dateRange.values[0][1] : null
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return null;
        }
    }

    /**
     * Funções de conversão (copiadas do script original)
     */
    convertPressure(deviceId, voltage) {
        const PRESSURE_CONVERSION_FACTORS = { 1: 40.0, 2: 40.0 };
        const PRESSURE_CORRECTION_VALUES = { 1: 0.0, 2: 6.0 };
        
        const factor = PRESSURE_CONVERSION_FACTORS[deviceId] || 1.0;
        const correction = PRESSURE_CORRECTION_VALUES[deviceId] || 0.0;
        return (voltage * factor) - correction;
    }

    convertDistance(voltage) {
        const DISTANCE_CONVERSION_FACTOR = 30.0;
        const DISTANCE_CORRECTION_VALUE = 0.0;
        return (voltage * DISTANCE_CONVERSION_FACTOR) - DISTANCE_CORRECTION_VALUE;
    }

    /**
     * Exporta dados para CSV (compatível com formato original)
     */
    exportToCSV(deviceId = null, startDate = null, endDate = null) {
        const data = this.getSensorData(deviceId, startDate, endDate);
        
        let header = "NL,Disp,Timestamp,VVal,Temp,Umid,PDOrv\n";
        let csvContent = header;

        data.forEach((record, index) => {
            const lineNumber = index + 1;
            const disp = record.device_id;
            const timestamp = record.timestamp;
            const vval = record.converted_value || "N/A";
            const temp = record.temperature_c || "N/A";
            const umid = record.humidity || "N/A";
            const pdorv = record.dew_point_c || "N/A";

            csvContent += `${lineNumber},${disp},${timestamp},${vval},${temp},${umid},${pdorv}\n`;
        });

        return csvContent;
    }

    /**
     * Exporta logs para CSV
     */
    exportLogsToCSV(startDate = null, endDate = null) {
        const logs = this.getCommunicationLogs(startDate, endDate);
        
        let header = "timestamp,direction,message\n";
        let csvContent = header;

        logs.forEach(log => {
            const msg = log.message.replace(/"/g, '""');
            csvContent += `${log.timestamp},${log.direction},"${msg}"\n`;
        });

        return csvContent;
    }
}

// Instância global do gerenciador SQLite
window.sqliteManager = new SQLiteManager();
