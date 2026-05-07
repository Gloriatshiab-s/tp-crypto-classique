def hash_gloria(message: str) -> str:
    """
    Fonction de hachage simple (non sécurisée pour la vraie cryptographie).
    Basée sur un sel fixe avec le nom: GLORIA TSHIABELA MUABU
    """
    seed = "GLORIA TSHIABELA MUABU"
    h = 0

    # Mélange d'abord le nom (seed), puis le message
    for char in seed + message:
        h = (h * 131 + ord(char)) % (2**32)

    # Retour en hexadécimal sur 8 caractères
    return format(h, "08x")


if __name__ == "__main__":
    texte = input("Entre un texte à hacher: ")
    print("Hash perso =", hash_gloria(texte))
