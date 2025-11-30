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
exports.onNewChatCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
// Inicializar Firebase Admin
// No Firebase Cloud Functions, usa Application Default Credentials automaticamente
// O Service Account JSON só é necessário para testes locais (emulators)
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Cloud Function que envia notificação push quando um novo chat é criado
 * Trigger: onCreate na coleção 'chats'
 *
 * Quando um usuário demonstra interesse em adotar um animal, esta função
 * envia uma notificação para o dono do animal informando que alguém
 * demonstrou interesse.
 */
exports.onNewChatCreated = (0, firestore_1.onDocumentCreated)('chats/{chatId}', async (event) => {
    var _a;
    try {
        const chatData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        const chatId = event.params.chatId;
        console.log('🔔 Novo chat criado:', chatId);
        if (!chatData) {
            console.log('⚠️ Dados do chat não encontrados');
            return null;
        }
        // Verificar se o chat tem participantes
        if (!chatData.participants || !Array.isArray(chatData.participants)) {
            console.log('⚠️ Chat sem participantes válidos');
            return null;
        }
        // Obter informações do contexto do chat
        const chatContext = chatData._chatContext || {};
        const animalName = chatContext.animalName || 'o animal';
        const interestedId = chatContext.interestedId;
        const donoId = chatContext.donoId;
        // Determinar quem receberá a notificação (o dono do animal)
        const recipientId = donoId;
        if (!recipientId) {
            console.log('⚠️ Não foi possível determinar o destinatário da notificação');
            return null;
        }
        console.log('👤 Destinatário:', recipientId);
        console.log('👤 Interessado:', interestedId);
        console.log('🐾 Animal:', animalName);
        // Buscar dados do usuário destinatário no Firestore
        const userDoc = await admin.firestore().collection('usuários').doc(recipientId).get();
        if (!userDoc.exists) {
            console.log('⚠️ Usuário destinatário não encontrado no Firestore');
            return null;
        }
        const userData = userDoc.data();
        const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
        if (!fcmToken) {
            console.log('⚠️ Usuário não possui token FCM registrado');
            return null;
        }
        // Buscar nome do usuário interessado (para personalizar a notificação)
        let interestedUserName = 'Alguém';
        if (interestedId) {
            try {
                const interestedUserDoc = await admin.firestore().collection('usuários').doc(interestedId).get();
                if (interestedUserDoc.exists) {
                    const interestedUserData = interestedUserDoc.data();
                    interestedUserName = (interestedUserData === null || interestedUserData === void 0 ? void 0 : interestedUserData.username) || (interestedUserData === null || interestedUserData === void 0 ? void 0 : interestedUserData.nome) || 'Alguém';
                }
            }
            catch (error) {
                console.error('❌ Erro ao buscar nome do usuário interessado:', error);
            }
        }
        console.log('📝 Preparando notificação...');
        console.log('   Título: Nova conversa iniciada! 🐾');
        console.log('   Mensagem:', `${interestedUserName} demonstrou interesse em adotar ${animalName}`);
        // Preparar payload da notificação
        const message = {
            token: fcmToken,
            notification: {
                title: 'Nova conversa iniciada! 🐾',
                body: `${interestedUserName} demonstrou interesse em adotar ${animalName}`,
            },
            data: {
                type: 'new_chat',
                chatId: chatId,
                animalId: chatContext.animalId || '',
                animalName: animalName,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'chat-updates',
                    sound: 'default',
                    icon: 'ic_notification',
                    color: '#88c9bf',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };
        // Enviar notificação
        console.log('📤 Enviando notificação via FCM...');
        const response = await admin.messaging().send(message);
        console.log('✅ Notificação enviada com sucesso:', response);
        return response;
    }
    catch (error) {
        console.error('❌ Erro ao enviar notificação:', error);
        return null;
    }
});
//# sourceMappingURL=index.js.map