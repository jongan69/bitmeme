;; using the SIP009 interface (testnet)
;; trait configured and deployed from ./settings/Devnet.toml
(impl-trait 'ST27Y8DVCJ832BSBVVC6EFQ2WXPPS21C64JZDBD22.bitmeme-trait.bitmeme-trait)

;; declare a new NFT
(define-non-fungible-token bitmeme uint)

;; store the last issued token ID
(define-data-var last-id uint u0)

;; map token-id to URI
(define-map token-uris {token-id: uint} {uri: (string-ascii 256)})

;; mint a new NFT with a custom URI
(define-public (claim (uri (string-ascii 256)))
  (let ((next-id (+ u1 (var-get last-id))))
    (var-set last-id next-id)
    (map-set token-uris {token-id: next-id} {uri: uri})
    (nft-mint? bitmeme next-id tx-sender)))

;; SIP009: Transfer token to a specified principal
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
     (asserts! (is-eq tx-sender sender) (err u403))
     ;; Make sure to replace NFT-FACTORY
     (nft-transfer? bitmeme token-id sender recipient)))

(define-public (transfer-memo (token-id uint) (sender principal) (recipient principal) (memo (buff 34)))
  (begin 
    (try! (transfer token-id sender recipient))
    (print memo)
    (ok true)))

;; SIP009: Get the owner of the specified token ID
(define-read-only (get-owner (token-id uint))
  ;; Make sure to replace NFT-NAME
  (ok (nft-get-owner? bitmeme token-id)))

;; SIP009: Get the last token ID
(define-read-only (get-last-token-id)
  (ok (var-get last-id)))

;; SIP009: Get the token URI for a specific token
(define-read-only (get-token-uri (token-id uint))
  (match (map-get? token-uris {token-id: token-id})
    uri-data (ok (some (get uri uri-data)))
    (ok none)))

;; Internal - Mint new NFT
(define-private (mint (new-owner principal))
    (let ((next-id (+ u1 (var-get last-id))))
      (var-set last-id next-id)
      ;; You can replace NFT-FACTORY with another name if you'd like
      (nft-mint? bitmeme next-id new-owner)))