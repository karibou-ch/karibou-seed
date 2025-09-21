# 🧪 URLs DE TEST - ERREURS DE PAIEMENT MODERNES

## 📋 Guide de Test pour kng-subscription-control

### **🔗 URLs de Test Complètes**

#### **1. 🔐 3D Secure Authentication Required**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=authenticate&reason=requires_action&intent=pi_3D_secure_test
```
**Comportement attendu :**
- Interface orange avec animation pulse
- Icône 🔐 "Confirmation de paiement requise"
- Bouton "Confirmer le paiement (3D Secure)"
- Classe CSS : `error-high`

---

#### **2. 💳 Carte Expirée**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=replace&reason=expired
```
**Comportement attendu :**
- Interface rouge
- Icône 💳 "Votre carte a expiré"
- Affichage méthode actuelle
- Interface `kng-user-payment` pour remplacement
- Classe CSS : `error-high`

---

#### **3. 💳 Méthode de Paiement Invalide**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=replace&reason=invalid_method
```
**Comportement attendu :**
- Interface rouge
- Icône 🔄 "Méthode de paiement invalide"
- Interface de remplacement
- Classe CSS : `error-high`

---

#### **4. 🚫 Carte Refusée**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=update&reason=declined
```
**Comportement attendu :**
- Interface rouge
- Icône 🚫 "Carte refusée"
- Affichage méthode concernée
- Interface de mise à jour
- Classe CSS : `error-high`

---

#### **5. ⚠️ Mise à Jour Générale**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=update&reason=generic
```
**Comportement attendu :**
- Interface rouge
- Icône ⚠️ "Mise à jour requise"
- Interface de modification
- Classe CSS : `error-medium`

---

#### **6. ➕ Aucune Méthode de Paiement (Setup)**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=setup&reason=missing
```
**Comportement attendu :**
- Interface rouge
- Icône ➕ "Aucune méthode de paiement configurée"
- Message équipe : "Notre équipe va vous contacter..."
- Interface d'ajout de carte
- Classe CSS : `error-high`

---

#### **7. 📞 Contacter la Banque**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=contact&reason=bank_declined
```
**Comportement attendu :**
- Interface orange
- Icône 📞 "Contactez votre banque"
- Section "Que faire ?" avec instructions
- Interface alternative de paiement
- Classe CSS : `error-medium`

---

#### **8. 🔄 Paiement Annulé (Retry)**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=retry&reason=canceled
```
**Comportement attendu :**
- Interface orange
- Icône 🔄 "Paiement annulé"
- Bouton "Réessayer le paiement"
- Classe CSS : `error-medium`

---

#### **9. 🔄 Retry Générique**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890&action=retry&reason=generic
```
**Comportement attendu :**
- Interface orange
- Icône 🔄 "Réessayer le paiement"
- Bouton de nouvelle tentative
- Classe CSS : `error-medium`

---

### **🔄 URLs de Test Legacy (Fallback)**

#### **10. Interface Legacy - Pas de Paramètres Modernes**
```
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_1234567890
```
**Comportement attendu :**
- Interface legacy si `contract_requires_action` ou `contract_requires_method`
- Fallback vers ancien système
- Pas d'interface moderne

---

### **⚡ URLs de Test Rapides (Copier-Coller)**

```bash
# 3D Secure
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=authenticate&reason=requires_action&intent=pi_test

# Carte expirée
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=replace&reason=expired

# Carte refusée
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=update&reason=declined

# Pas de carte
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=setup&reason=missing

# Contact banque
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=contact&reason=bank_declined

# Retry
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=retry&reason=canceled
```

---

### **🎯 Points de Validation**

#### **✅ Vérifications Visuelles**
1. **Icônes** : Chaque type d'erreur affiche la bonne icône
2. **Couleurs** : Rouge (high), Orange (medium), Jaune (low)
3. **Animation** : Pulse pour urgence haute
4. **Bordures** : Bordure gauche colorée selon urgence

#### **✅ Vérifications Fonctionnelles**
1. **Parsing URL** : Tous les paramètres sont correctement extraits
2. **Messages** : Messages dynamiques selon action/reason
3. **Boutons** : Boutons spécifiques selon le type d'erreur
4. **Fallback** : Interface legacy fonctionne sans paramètres modernes

#### **✅ Vérifications Techniques**
1. **Console** : Pas d'erreurs JavaScript
2. **Getters** : `hasModernPaymentError`, `shouldShowLegacyError` fonctionnent
3. **Classes CSS** : Classes d'urgence appliquées correctement
4. **Compatibilité** : Ancien système fonctionne toujours

---

### **🐛 Tests de Cas d'Edge**

#### **Paramètres Manquants**
```
# Action sans reason
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=authenticate

# Reason sans action
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&reason=expired

# Contract inexistant
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_inexistant&action=setup&reason=missing
```

#### **Valeurs Inattendues**
```
# Action inconnue
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=unknown&reason=test

# Reason inconnue
http://localhost:4200/store/artamis/home/me/subscriptions?contract=sub_test&action=setup&reason=unknown
```

---

### **📊 Matrice de Test**

| Action | Reason | Urgency | Icon | Interface | CSS Class |
|--------|--------|---------|------|-----------|-----------|
| authenticate | requires_action | high | 🔐 | 3D Secure | error-high |
| replace | expired | high | 💳 | Remplacement | error-high |
| replace | invalid_method | high | 🔄 | Remplacement | error-high |
| update | declined | high | 🚫 | Mise à jour | error-high |
| update | generic | medium | ⚠️ | Mise à jour | error-medium |
| setup | missing | high | ➕ | Setup + équipe | error-high |
| contact | bank_declined | medium | 📞 | Contact banque | error-medium |
| retry | canceled | medium | 🔄 | Retry | error-medium |
| retry | generic | medium | 🔄 | Retry | error-medium |

---

## 🚀 **INSTRUCTIONS DE TEST**

1. **Démarrer le serveur** : `ng serve`
2. **Copier une URL** de test ci-dessus
3. **Coller dans le navigateur** et valider
4. **Vérifier l'interface** selon le comportement attendu
5. **Tester les interactions** (boutons, formulaires)
6. **Vérifier la console** pour les erreurs

**Bon test ! 🧪✅**

