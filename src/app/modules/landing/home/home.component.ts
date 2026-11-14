import {
    AfterViewInit,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

/** Hauteur de la barre de navigation fixe (h-20) plus une marge. */
const NAVBAR_OFFSET_PX = 88;

interface FaqItem
{
    question: string;
    answer: string;
}

@Component({
    selector     : 'landing-home',
    templateUrl  : './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LandingHomeComponent implements OnInit, AfterViewInit, OnDestroy
{
    openFaq = 0;

    readonly faqItems: FaqItem[] = [
        {
            question: 'Qu\u2019est-ce que NufiSend ?',
            answer  : 'NufiSend est une plateforme de communication WhatsApp qui vous permet de synchroniser vos contacts, de créer des groupes de diffusion, de préparer des modèles de messages et de programmer vos envois depuis une interface unique.'
        },
        {
            question: 'Comment NufiSend se connecte-t-il \u00e0 WhatsApp ?',
            answer  : 'NufiSend se raccorde \u00e0 votre compte WhatsApp Business via l\u2019API officielle de Meta. Vous autorisez la connexion depuis votre espace, puis NufiSend envoie vos messages depuis votre num\u00e9ro professionnel. Vous pouvez d\u00e9connecter le canal \u00e0 tout moment.'
        },
        {
            question: 'Puis-je programmer mes messages \u00e0 l\u2019avance ?',
            answer  : 'Oui. Choisissez la date et l\u2019heure de votre envoi. Votre message apparaît ensuite dans votre tableau de bord parmi les envois programmés, jusqu\u2019\u00e0 son départ.'
        },
        {
            question: 'Mes contacts sont-ils modifi\u00e9s ou supprim\u00e9s ?',
            answer  : 'Non. NufiSend lit vos contacts pour les synchroniser dans votre annuaire. Votre carnet d\u2019adresses reste intact et vous gardez le contr\u00f4le sur vos donn\u00e9es.'
        },
        {
            question: 'Ai-je besoin d\u2019un compte WhatsApp Business ?',
            answer  : 'Un compte WhatsApp Business est n\u00e9cessaire pour b\u00e9n\u00e9ficier des offres NufiSend. Si vous n\u2019en avez pas encore, nous vous accompagnons dans sa cr\u00e9ation et sa v\u00e9rification.'
        },
        {
            question: 'Quel est le prix des offres ?',
            answer  : 'L\u2019offre D\u00e9couverte d\u00e9marre \u00e0 9 000 FCFA par mois et inclut 500 messages. La connexion par QR code de votre WhatsApp personnel reste disponible, factur\u00e9e 10 FCFA par message livr\u00e9, sans abonnement.'
        },
        {
            question: 'Mes donn\u00e9es sont-elles prot\u00e9g\u00e9es ?',
            answer  : 'Vos mots de passe sont stock\u00e9s sous forme de hash et vos sessions sont prot\u00e9g\u00e9es par un jeton d\u2019authentification. Vous pouvez d\u00e9connecter votre session WhatsApp et g\u00e9rer vos informations depuis votre compte.'
        }
    ];

    private revealObserver?: IntersectionObserver;

    /**
     * Constructor
     */
    constructor(
        private _title: Title,
        private _meta: Meta,
        private _viewportScroller: ViewportScroller
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void
    {
        // Liens internes (#features...) : la section n'est pas masquee par la barre fixe.
        this._viewportScroller.setOffset([0, NAVBAR_OFFSET_PX]);
        this._title.setTitle('NufiSend \u2014 Communication WhatsApp simplifi\u00e9e');
        this._meta.updateTag({
            name   : 'description',
            content: 'NufiSend connecte votre WhatsApp Business : contacts, groupes de diffusion, mod\u00e8les de messages et envois programm\u00e9s depuis une interface unique.'
        });
    }

    ngAfterViewInit(): void
    {
        const elements = Array.from(
            document.querySelectorAll<HTMLElement>('.nufisend-landing [data-reveal]')
        );

        if ( !('IntersectionObserver' in window) )
        {
            elements.forEach((element) => element.classList.add('is-visible'));
            return;
        }

        this.revealObserver = new IntersectionObserver((entries) =>
        {
            entries.forEach((entry) =>
            {
                if ( !entry.isIntersecting )
                {
                    return;
                }

                entry.target.classList.add('is-visible');
                this.revealObserver?.unobserve(entry.target);
            });
        }, {
            threshold : 0.12,
            rootMargin: '0px 0px -48px 0px'
        });

        elements.forEach((element) => this.revealObserver?.observe(element));
    }

    ngOnDestroy(): void
    {
        this.revealObserver?.disconnect();
        this._viewportScroller.setOffset([0, 0]);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    toggleFaq(index: number): void
    {
        this.openFaq = this.openFaq === index ? -1 : index;
    }
}
