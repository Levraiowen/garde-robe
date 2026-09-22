"""Interface en ligne de commande (démo du moteur en attendant l'UI)."""

from __future__ import annotations

import argparse

from .models import GardeRobe, Saison
from .recommandations import suggerer
from .styles import profil_style
from .tenues import generer_tenues


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="garde-robe", description="Garde-robe virtuelle")
    parser.add_argument("fichier", help="Fichier JSON de la garde-robe")
    sub = parser.add_subparsers(dest="commande", required=True)

    p_tenues = sub.add_parser("tenues", help="Proposer les meilleures tenues")
    p_tenues.add_argument("-n", "--nombre", type=int, default=10)
    p_tenues.add_argument("-s", "--saison", choices=[s.value for s in Saison])
    p_tenues.add_argument("-f", "--formalite", type=int, choices=range(1, 6))

    sub.add_parser("styles", help="Afficher le profil de style")
    sub.add_parser("suggestions", help="Suggestions d'achats / d'inspiration")

    args = parser.parse_args(argv)
    gr = GardeRobe.charger(args.fichier)

    if args.commande == "tenues":
        saison = Saison(args.saison) if args.saison else None
        for i, t in enumerate(generer_tenues(gr, saison, args.formalite, args.nombre), 1):
            print(f"{i:>2}. {t}")
            print(f"    {' · '.join(t.raisons)}")

    elif args.commande == "styles":
        for style, part in profil_style(gr):
            print(f"{style:<15} {'█' * round(part * 40)} {part:.0%}")

    elif args.commande == "suggestions":
        for s in suggerer(gr):
            print(f"- {s.raison}")
            for nom, url in s.liens.items():
                print(f"    {nom}: {url}")


if __name__ == "__main__":
    main()
