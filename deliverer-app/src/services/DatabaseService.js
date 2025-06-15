import * as SQLite from 'expo-sqlite';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      this.db = SQLite.openDatabase('deliverer_app.db');
      await this.createTables();
      console.log('📱 Banco de dados SQLite inicializado');
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          // Tabela de pedidos cache
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS cached_orders (
              id TEXT PRIMARY KEY,
              data TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Tabela de histórico de entregas
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS delivery_history (
              id TEXT PRIMARY KEY,
              order_data TEXT NOT NULL,
              delivered_at DATETIME NOT NULL,
              sync_status TEXT DEFAULT 'pending',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Tabela de configurações locais
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS app_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Tabela de logs para debug
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS app_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              level TEXT NOT NULL,
              message TEXT NOT NULL,
              data TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Índices para performance
          tx.executeSql(`
            CREATE INDEX IF NOT EXISTS idx_cached_orders_status 
            ON cached_orders(status);
          `);

          tx.executeSql(`
            CREATE INDEX IF NOT EXISTS idx_delivery_history_sync 
            ON delivery_history(sync_status);
          `);

          console.log('✅ Tabelas SQLite criadas com sucesso');
        },
        (error) => {
          console.error('Erro ao criar tabelas:', error);
          reject(error);
        },
        () => {
          resolve();
        }
      );
    });
  }

  // OPERAÇÕES COM PEDIDOS CACHE
  async cacheOrder(order) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO cached_orders (id, data, status, updated_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [order.id, JSON.stringify(order), order.status],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async getCachedOrders(status = null) {
    return new Promise((resolve, reject) => {
      const query = status 
        ? `SELECT * FROM cached_orders WHERE status = ? ORDER BY created_at DESC`
        : `SELECT * FROM cached_orders ORDER BY created_at DESC`;
      
      const params = status ? [status] : [];

      this.db.transaction(
        (tx) => {
          tx.executeSql(
            query,
            params,
            (_, { rows }) => {
              const orders = [];
              for (let i = 0; i < rows.length; i++) {
                const row = rows.item(i);
                orders.push({
                  ...JSON.parse(row.data),
                  cached_at: row.created_at,
                  updated_at: row.updated_at
                });
              }
              resolve(orders);
            },
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async updateCachedOrderStatus(orderId, newStatus) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          // Primeiro, buscar o pedido atual
          tx.executeSql(
            `SELECT data FROM cached_orders WHERE id = ?`,
            [orderId],
            (_, { rows }) => {
              if (rows.length > 0) {
                const orderData = JSON.parse(rows.item(0).data);
                orderData.status = newStatus;

                // Atualizar com novo status
                tx.executeSql(
                  `UPDATE cached_orders SET data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                  [JSON.stringify(orderData), newStatus, orderId],
                  (_, result) => resolve(result),
                  (_, error) => reject(error)
                );
              } else {
                reject(new Error('Pedido não encontrado no cache'));
              }
            },
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async removeCachedOrder(orderId) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `DELETE FROM cached_orders WHERE id = ?`,
            [orderId],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  // OPERAÇÕES COM HISTÓRICO DE ENTREGAS
  async saveDeliveryHistory(order) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO delivery_history (id, order_data, delivered_at, sync_status) 
             VALUES (?, ?, CURRENT_TIMESTAMP, 'pending')`,
            [order.id, JSON.stringify(order)],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async getDeliveryHistory(limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT * FROM delivery_history ORDER BY delivered_at DESC LIMIT ?`,
            [limit],
            (_, { rows }) => {
              const history = [];
              for (let i = 0; i < rows.length; i++) {
                const row = rows.item(i);
                history.push({
                  ...JSON.parse(row.order_data),
                  delivered_at: row.delivered_at,
                  sync_status: row.sync_status,
                  local_id: row.id
                });
              }
              resolve(history);
            },
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async markHistoryAsSynced(orderId) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `UPDATE delivery_history SET sync_status = 'synced' WHERE id = ?`,
            [orderId],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  // OPERAÇÕES COM CONFIGURAÇÕES
  async setSetting(key, value) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO app_settings (key, value, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [key, JSON.stringify(value)],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async getSetting(key, defaultValue = null) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT value FROM app_settings WHERE key = ?`,
            [key],
            (_, { rows }) => {
              if (rows.length > 0) {
                try {
                  resolve(JSON.parse(rows.item(0).value));
                } catch (error) {
                  resolve(rows.item(0).value);
                }
              } else {
                resolve(defaultValue);
              }
            },
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  // OPERAÇÕES COM LOGS
  async addLog(level, message, data = null) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO app_logs (level, message, data) VALUES (?, ?, ?)`,
            [level, message, data ? JSON.stringify(data) : null],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async getLogs(limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT * FROM app_logs ORDER BY created_at DESC LIMIT ?`,
            [limit],
            (_, { rows }) => {
              const logs = [];
              for (let i = 0; i < rows.length; i++) {
                logs.push(rows.item(i));
              }
              resolve(logs);
            },
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  async clearOldLogs(daysOld = 7) {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `DELETE FROM app_logs WHERE created_at < datetime('now', '-${daysOld} days')`,
            [],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        }
      );
    });
  }

  // OPERAÇÕES DE LIMPEZA E MANUTENÇÃO
  async clearCache() {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(`DELETE FROM cached_orders`, [], (_, result) => {
            console.log('Cache de pedidos limpo');
            resolve(result);
          }, (_, error) => reject(error));
        }
      );
    });
  }

  async getStorageInfo() {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          const queries = [
            `SELECT COUNT(*) as count FROM cached_orders`,
            `SELECT COUNT(*) as count FROM delivery_history`,
            `SELECT COUNT(*) as count FROM app_settings`,
            `SELECT COUNT(*) as count FROM app_logs`
          ];

          let completed = 0;
          const results = {};

          queries.forEach((query, index) => {
            tx.executeSql(query, [], (_, { rows }) => {
              const tableName = ['cached_orders', 'delivery_history', 'app_settings', 'app_logs'][index];
              results[tableName] = rows.item(0).count;
              completed++;

              if (completed === queries.length) {
                resolve(results);
              }
            }, (_, error) => reject(error));
          });
        }
      );
    });
  }
}

export const DatabaseService = new DatabaseService();