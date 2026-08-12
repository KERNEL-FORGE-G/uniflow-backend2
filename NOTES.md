\# Notes et demandes en attente — UniFlow Backend



Ce fichier trace les demandes reçues qui ne sont pas dans le périmètre immédiat du sprint de 4 semaines (P0), pour ne pas les perdre.



\## Demande reçue le 23/07/2026 (via Chef de projet / retour équipe)



> "N'oubliez pas qu'il y a un système de tchat intégré dans l'app et un storage, pour les fichiers de moins de 1 Mo vous utilisez le Supabase Storage et pour le reste à vous de voir la meilleure solution. Créer une limite pour les fichiers à uploader, ce n'est pas une application de conversation ici mais une application universitaire. Lors de la manipulation des listes il faut faire une différence entre les noms sur les listes et les comptes user."



\### Analyse par rapport au CDC



| Point | Section CDC | Priorité | Statut |

|---|---|---|---|

| Système de tchat/messagerie | §4.4 Module Communication | P2 (V2) | Non commencé — hors périmètre du sprint actuel |

| Stockage fichiers < 1 Mo → Supabase Storage | §7 Stack technique | Déjà prévu dans la stack | À implémenter avec le module `notifications`/partage de fichiers (P1) |

| Stockage fichiers > 1 Mo → solution à définir | Non précisé dans le CDC | — | \*\*À décider\*\* : Cloudinary (déjà dans la stack, §7) semble le candidat naturel pour les fichiers plus lourds (médias, exports PDF) |

| Limite d'upload à définir | Non précisé dans le CDC | — | \*\*Action à faire\*\* : ajouter une contrainte de taille (ex. `MaxFileSizeValidator` NestJS) sur tous les endpoints d'upload, dès qu'on les créera |

| Différence "nom sur liste" vs "compte user" | Lié à §4.7 Présences | P0 (présences) | \*\*Important — à traiter à la Semaine 4\*\* (module `attendance`) |



\### Actions à prévoir



1\. \*\*Semaine 4 (attendance)\*\* : le modèle `AttendanceRecord` doit pouvoir enregistrer un nom sans exiger de lien obligatoire vers un `User`/`Student` existant (cas d'un étudiant présent physiquement mais non encore inscrit dans le système, ou nom saisi manuellement par le délégué).

2\. \*\*V2 (hors sprint)\*\* : module de messagerie (chat) — non commencé, priorité P2 confirmée par le CDC.

3\. \*\*Dès le prochain module de fichiers (notifications/annonces, P1)\*\* : implémenter la limite de taille d'upload + logique de routage Supabase Storage (< 1 Mo) vs Cloudinary (≥ 1 Mo, à confirmer).

\---
## Suggestion en attente — préfixe /api/v1 (proposé par Dev C, 03/08/2026)

Dev C a proposé `app.setGlobalPrefix('api/v1')` dans main.ts, cohérent avec la convention 
du CDC (§10.1 : URL de base prod `https://api.uniflow.edu/api/v1`). 

**Non appliqué pour l'instant** : ce changement casserait toutes les routes actuelles utilisées 
par Mobile/Desktop en développement. À planifier en équipe (Chef de projet + tous les devs) 
avant de l'introduire, idéalement en fin de sprint ou lors d'une bascule coordonnée où tout 
le monde met à jour ses appels API en même temps.
