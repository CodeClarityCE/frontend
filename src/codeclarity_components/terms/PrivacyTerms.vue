<script setup lang="ts">
import router from '@/router';
import Button from '@/shadcn/ui/button/Button.vue';
</script>

<template>
    <div class="flex flex-col gap-4 p-12">
        <div class="text-3xl self-center">Gestion des données personnelles</div>
        <div class="text-2xl pt-4">Objet du traitement (finalité et base légale)</div>
        <div>
            <span>
                La société CodeClarity,
                <!-- dont le siège est situé à CONFIANCE (96 000), Rue la Transparence,  -->
                dispose d'un site internet proposant un service d'aide aux développeurs. Ce site
                permet de recevoir les inscriptions de nos clients et les données collectées à cette
                occasion sont enregistrées et traitées dans un fichier clients. </span><br /><br />
            <span>
                Ce fichier permet de :
                <ul class="list list-inside list-disc pl-4">
                    <li>Gérer les commandes, le paiement et la livraison.</li>
                    <li>
                        Mener des opérations de marketing (fidélisation, promotions) et adresser des
                        publicités par courriel auprès de nos clients qui ne s'y sont pas opposés ou
                        qui l'ont accepté :
                        <ul class="list list-inside list-disc pl-4">
                            <li>Sur des produits analogues à ceux qu'ils ont commandés.</li>
                            <li>
                                Sur d'autres produits proposés par la société. Par exemple, si un
                                client achète un abonnement, une offre de support pourra lui être
                                proposée.
                            </li>
                        </ul>
                    </li>
                    <!-- <li>Transmettre les données de nos clients qui l'ont accepté à nos partenaires commerciaux, pour leur permettre d'adresser de la publicité (cf. ci-dessous).</li> -->
                </ul>
            </span>
        </div>

        <div class="text-2xl pt-4">Bases légales des traitements</div>
        <div>
            <ul class="list list-inside list-disc pl-4">
                <li>
                    Gestion des commandes : la base légale du traitement est l'exécution d'un
                    contrat (Cf. article 6.1.b) du Règlement européen sur la protection des données.
                </li>
                <li>
                    Envoi de sollicitations commerciales par courriel sur des produits analogues à
                    ceux commandés par les clients : la base légale du traitement est l'intérêt
                    légitime de la société (Cf. article 6.1.f) du Règlement européen sur la
                    protection des données), à savoir promouvoir nos produits auprès de nos clients.
                </li>
                <li>
                    Envoi de sollicitations commerciales par courriel sur d'autres produits proposés
                    par la société CodeClarity : la base légale du traitement est le consentement
                    (Cf. article 6.1.a) du Règlement européen sur la protection des données), comme
                    l'exige l'article L. 34-5 du code des postes et des communications
                    électroniques.
                </li>
                <!-- <li>Transmission de l'adresse électronique aux partenaires commerciaux : la base légale du traitement est le consentement (Cf. article 6.1.a) du Règlement européen sur la protection des données).</li> -->
                <li>
                    Tenue de la comptabilité impliquant la conservation des données pour une période
                    de 10 ans : la base légale du traitement est l'obligation légale (Cf. article
                    6.1.c du Règlement européen sur la protection des données).
                </li>
            </ul>
        </div>

        <div class="text-2xl pt-4">Catégories de données</div>
        <div>
            <ul class="list list-inside list-disc pl-4">
                <li>
                    Identité : civilité, nom, prénom, adresse, adresse de livraison, numéro de
                    téléphone, adresse électronique, date de naissance, code interne de traitement
                    permettant l'identification du client, données relatives à l'enregistrement sur
                    des listes d'opposition.
                </li>
                <li>
                    Données relatives aux commandes : numéro de la transaction, détail des achats,
                    montant des achats, données relatives au règlement des factures (règlements,
                    impayés, remises), retour de produits.
                </li>
                <li>
                    Données relatives aux moyens de paiement : numéro de carte bancaire, date de fin
                    de validité de la carte bancaire, cryptogramme visuel (lequel est immédiatement
                    effacé).
                </li>
                <li>
                    Données nécessaires à la réalisation des actions de fidélisation et de
                    prospection : historique des achats.
                </li>
            </ul>
        </div>

        <div class="text-2xl pt-4">Destinataires des données</div>
        <div>
            <ul class="list list-inside list-disc pl-4">
                <li>
                    Les services clients et facturation de la société CodeClarity sont destinataires
                    de l'ensemble des catégories de données.
                </li>
                <!-- <li>Ses sous-traitants, chargés de la livraison de ses commandes, sont destinataires de l'identité, de l'adresse et du numéro de téléphone de nos clients.</li> -->
                <!-- <li>Les adresses électroniques des clients qui l'ont accepté sont transmises à de nos partenaires commerciaux (liste des partenaires commerciaux, régulièrement mise à jour) :
                    <ul class="list list-inside list-disc pl-4">
                        <li>société X</li>
                        <li>société Y</li>
                        <li>société Z</li>
                    </ul>
                </li> -->
            </ul>
        </div>

        <div class="text-2xl pt-4">Catégories de données</div>
        <div>
            <ul class="list list-inside list-disc pl-4">
                <li>
                    Données nécessaires à la gestion des commandes et à la facturation : pendant
                    toute la durée de la relation commerciale et dix (10) ans au titre des
                    obligations comptables.
                </li>
                <li>
                    Données nécessaires à la réalisation des actions de fidélisation et à la
                    prospection : pendant toute la durée de la relation commerciale et trois (3) ans
                    à compter du dernier achat.
                </li>
                <li>
                    Données relatives aux moyens de paiement : ces données ne sont pas conservées
                    par la société CodeClarity ; elles sont collectées lors de la transaction et
                    sont immédiatement supprimées dès le règlement de l'achat.
                </li>
                <li>
                    Données concernant les listes d'opposition à recevoir de la prospection : trois
                    (3) ans.
                </li>
            </ul>
        </div>

        <div class="text-2xl pt-4">Vos droits</div>
        <div>
            <span>
                Si vous ne souhaitez plus recevoir de publicité de la part de la société CodeClarity
                (exercice du droit d'opposition ou retrait d'un consentement déjà donné),
                contactez-nous (prévoir ici un lien vers un formulaire d'exercice des droits
                informatique et libertés, faisant apparaître les différentes hypothèses détaillées
                ci-dessus). </span><br />
            <!-- <span>
                Si, après avoir consenti à ce que vos données soient transmises à nos partenaires commerciaux, vous souhaitez revenir sur ce choix et ne plus recevoir publicité de leur part, contactez-nous (prévoir ici un lien vers le formulaire d'exercice des droits informatique et libertés).

                (NB : un lien permettant aux clients et prospects de demander la suppression de leur adresse électronique de la liste de prospection doit systématiquement figurer sur les sollicitations envoyées par courriel)
            </span><br> -->
            <span>
                Vous pouvez accéder aux données vous concernant, les rectifier ou les faire effacer.
                Vous disposez également d'un droit à la portabilité et d'un droit à la limitation du
                traitement de vos données (Consultez le site cnil.fr pour plus d'informations sur
                vos droits). </span><br />
            <span>
                Pour exercer ces droits ou pour toute question sur le traitement de vos données dans
                ce dispositif, vous pouvez contacter notre DPO.
                <ul>
                    <li>Contacter notre DPO par voie électronique : dpo@codeclarity.io</li>
                </ul>
            </span>
        </div>
        <Button @click="router.back()">Go back</Button>
    </div>
</template>
