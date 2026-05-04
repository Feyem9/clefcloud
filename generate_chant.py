from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
import os

# Données des 20 chants
chants = [
    {
        "numero": "01",
        "titre": "MOO LULUE",
        "reference": "Lc 15,11-32",
        "refrain": "Wee,aye, Sie Mboo ma e\nYee, nga comsi o e, aye Yahwe yu' men o e,\nSie mboo nkwe nu yu' men o la Cə nzen ma lee!",
        "couplets": [
            "Shʉapʉ Sie yii na lɛ,cə ma lɛ.\nNga pʉa ta zhinu za patnjam e, nga yaa nu e,\nN da la'ntom Mbee no ma nga ko ya wu papa e.\nNkwe ngwe' nkoʻmfi ma nga nza mfat ya thu'lee!",
            "Na nkop nu nga ghʉ la, Sie Mboo ma lee,\nNα nkop nkwe nu nga hee lα\nPa' ndah pa' men o wo(mα) nzi lα,\nLah a po' mo' nga'mfa mbee lα",
            "Letia Mbα, ngα kaa ta ngwe kaa la mimie e,\nYaa ba mα nda si kwe mbʉa ghu zhinu e\nShʉapʉ mα ngua ha a zhi nu e,\nPamfa' mba'o,po mvah za mbat mα nnu",
            "Nzhieku lα ko a, ta n dah mfa' Lah mambia pangʉnǝ.\nMbα ndα' ncααnǝ lα, wα ha a lee Papa e,\nngα imbatjam mbee, Nga yii nu ndinde, o Mboo ma cǝ",
            "Wo ya moo, ngα cak o, ta o fhʉ e,\nMvaklie ma ngα lo nten manzhi mbʉa cak o lee.\nO lala ntom mbee pen ma nza ncak pǝpe\nMa hα lee? Mbee yee tʉa sie o ba nza ncak kwa'ka lee?"
        ]
    },
    {
        "numero": "02",
        "titre": "ZHIE' MBO MO NKO",
        "reference": "",
        "refrain": "Zhie' mbo mo nko mbi pah\nZhie' mbo nko tehndoo yoh\nShʉapʉ Yahwe, Mboo yoh,\nKo la lee (bis) yee Sie yoh.",
        "couplets": [
            "Pah lah na sie Mboo yoh\nTa nah ma nsa' ku'ni o.",
            "Pah lah mben o Mboo yoh\nMbat nah mandoo ndii zo\nShʉapʉ ko la lee, Mboo yoh, kola lee.",
            "Pah munha mbu o Mboo yoh\nMba natu Nduasie o lee\nShuapu, ko la lee, Mboo yoh,ko la lee.",
            "Pah ma' mbo mbu o Mboo yoh\nMa cʉco o si waa,\nShʉapʉ, ko la lee, Mboo yoh, ko la lee.",
            "Mba nda tə kuu Sie yoh\nMba nda' men tok lʉa' lee.\nShʉapʉ, ko la lee Mboo yoh, ko la lee.",
            "O si waa ba Mboo yoh,\nYii ma nda' nthʉ pʉ mbo.\nShʉapʉ, ko la lee, Mboo yoh, ko la lee."
        ]
    },
    {
        "numero": "03",
        "titre": "KO PO' ZA LO",
        "reference": "",
        "refrain": "Ko po' za la Shʉapʉ, ko po za lα\nSie yoh ko ya pu'na lα Sie Mboo ma e\nSie yoh ko ya pu'na' lα Sie Mboo ma e\nKo po' za la Shʉapʉ, ko po' za lee.",
        "couplets": [
            "Shʉapʉ Mboo Mbα' Sie la' yoh ngα mʉ nhα\nNga lah nsa' lee, Sie Mboo ma e.",
            "Ko nα' sie nα bee lee Ko la na nheenu ma\nNgα lah nteh njↄ yaa, Sie Mboo ma e",
            "Ko la ngα lααsi o lee Nα zen Men o Yeso\nMα o si yok a lee, Sie Mboo ma e",
            "Wo ta ngα mʉntak lee Wo Sie ngα' ngu'wa' e\nMα o ko ya pu'na' la, Sie Mboo ma e.",
            "Ngα ha ma mba'ntam a Ngα ha ma nkwe nthʉ a lee\nO si waa lee, Sie Mboo ma e.",
            "Yaa ba mba nda' na' ntaa Tok lua pi te kuu\nO si waa lee, Sie Mboo ma e."
        ]
    },
    {
        "numero": "04",
        "titre": "N DA NE' NJII",
        "reference": "",
        "refrain": "N da ne' njii nden ma me be le ten\nTenmvak yaa mbuo YAHWE,\nNda ne' njii nden ma ma bee le ten\nNa mvak yi o kwe'a la YAHWE",
        "couplets": [
            "Yahwe papee za ya\nPa kα mvαh ta mua zhαα 'lα 0.\nPa kα mvαh nden ma pọ nú nghu\nMα po insα tok a le Yahwe",
            "tα ngα nne'sie mba jona, si ca Yahwe o mα ya mvʉ'loh la ma o.\nNtie nga stoh nkwen la sie Mboo má\nNgα nne' ndα poh yaa mbα nehe",
            "Sie nboo ma, sie nkwe'ni la simie eee\nWo banda yinca nkinken nha i 000\nNdu zhuα sco stam kwa yʉa",
            "Pia ba le, pia men o Shʉapʉ lee\nYahwe, o ma ya nkwe nu wa'\nO Ndak sipé kα la nu mo' ntu aah\nMa a pee mersiven nehe"
        ]
    },
    {
        "numero": "05",
        "titre": "NDINGOO MARIA",
        "reference": "",
        "refrain": "Ndingoo maria, Mbuani mafu munzhwee,\nNtam nku'ni mo, Comsi yoh mafu a puh\nYee mafu yoh lee, comnsi yoh.",
        "couplets": [
            "o siemba ma yoh ndinde ,ma puh pi sieca'\nO ye nshua nkwe punzhwie, comsi yoh ma yoh lee.\nYee mafu yoh lee comsi yoh,",
            "mboo ma wo ngoo sifopsi,\nNdingoo moonko'ko nta' yoh mafu a puh,\nComnsi yoh ma yoh lee\nYee mafu yoh lee comsi yoh.",
            "shʉαpʉ mbuani moonko'\nMaa letia ta nshuasi lah Mboo natu yoh,\nComnsi yoh ma yoh lee\nYee mafu yoh lee comsi yoh",
            "Ndingoo ma'a nkwe siecα\nNkwe ngwe' n'en ndak ngen tu\nMengua si nku'ni mo, comme yoh ma yoh lee\nYee mafu yoh lee, comnsi yoh."
        ]
    },
    {
        "numero": "06",
        "titre": "MBOO MA LEE CƏ MA",
        "reference": "",
        "refrain": "Mboo ma lee, cǝ ma o\nMboo ma lee, ce ma o ooo.",
        "couplets": [
            "Shʉapʉ nshu'ngwe' lee, Yeso\nNgα hee nu tα'\nNgα co nshua' mo, ca ma o.",
            "Wo Menzhʉnzhua Sie, Yeso\nO nteh nusipe' ngwe'\nFah mba nda' zah zo njii na lee.",
            "Kwesi nusipe la si kwesi nja' nusipe\nma nga' la' poa ntao cǝǝ zen ma a\nCoda: Shʉapʉ сə, сə ma o"
        ]
    },
    {
        "numero": "07",
        "titre": "NJA'NSHI MBI YERUSALEM",
        "reference": "Psaume 147",
        "refrain": "Ha nku'ni mi, nku'ni Shʉapʉ Sie Yerusalem, ŋamsi i lee.\nKu'ni i, nca'si Sie Mboo mo Sion lee, Alleluia.",
        "couplets": [
            "Nkopndʉa mo ma a kwat tα ntoo\nNsa' ta ndua njo'si poo mbo\nMbuααni kaasi ndhu la' zo\nA cii mo mα nsa' tα o viat.",
            "A tom ghəǝ mi ndom Siecα\nGhe mi kaasi i tα a mie\nAlleluia, yayakam e, alleluia.",
            "Niimbak nzα ma a sa' mbombo yaa\nBee foh le lee, pa' wa piaa lee?\nA ncah ghə mi nii moe nzα\nA ntom yeh zi,nshi fi' tα mie.",
            "A tehsi ghəǝ mi mbi Yakob\nPia nkwe nshʉa' mi mbi Israel\nAlleluia, Yayakam e, yayakam e.",
            "Sə tomla' a lα' lah i fe'e lee,\nMo' səǝ yaa la' zhi nkwe'ni mi,\nKu'ni i,nca'si Sie Mboo mo Sion lee, yayakam e"
        ]
    },
    {
        "numero": "08",
        "titre": "SIE YU' GHE ZA",
        "reference": "",
        "refrain": "Sie yu' ghẻ za lee (x2)\nE e e e, sie ten mαnju\nsie yu' ghe za lee, sieten mαnju (x2)\nSie yu' ghé za lee.",
        "couplets": [
            "Nda bαnden n ka cak o sie o\nPo len mα ngα wentia\nNden mα Kwa mʉ yaa lee\nMα ya zen si nka bα",
            "N αα bαndes mα o wα' a sie o\nTa' mα po ba lalers.\nNden mα o la si ceh a lee\nTa o banda si la",
            "Nola banden ma o wa' a sie o\no ba kamanam riju mania yα zet lee,\nta' papee za la zhi sipa mxa ngap mbia men i\nli pia ba ntoo ma nkopei a",
            "Wo bα kala' ha ya shetapt nha men o\nmen mbe kam si kam pʉrok bα lee\nKam yo α lah nghi wentia\nwo bα kala ha yα shʉapʉ nhα"
        ]
    },
    {
        "numero": "09",
        "titre": "CƎƎ YOH LEE",
        "reference": "",
        "refrain": "Cǝǝ yoh lee\nCǝǝ yoh e, Shʉapʉ\nCǝǝ nzen moh\nCǝǝ yoh e",
        "couplets": [
            "Mboo Mbα' yoh Nghunʉ pəh e\nPαh co Nshuα' moh Ste yoh\nPαh ko ndααsi 0, cǝǝ yoh lee",
            "Ye so Kristo\nWo bα Menma yoh\nNshʉambhi yoh lee, pαh lααsi 0\nKo nshʉʉ yoh lα lee.",
            "Letia-Yehni\nPαh khʉα ntak 0 lee\nWo Nshuα Nshinah pah lααsi o\nLʉ' Nkα' zo lee."
        ]
    },
    {
        "numero": "10",
        "titre": "PEN SA'",
        "reference": "Is 55,1 — Communion",
        "refrain": "Pen sα', pen yi nzhie nshi nko yee lα o!\nPen sα' nzα nnu si pee o\nPen sα', mu bα ko nceh yee lα o\nPen zα nnu, a pen zα nnu e eee!",
        "couplets": [
            "Pen sα', nshi bee mα yaa ndee o\nZαhnshi kα si' njom lα bα,\nPen zα nnu, pen za nnu e eee!",
            "Wuzα, wuzα vαh ndinde o\nPi ndu' mα yaa fhʉ puh mfi'\nPen zα nnu, pen zα nnu e eee!",
            "Pen sα' njwen le nzα si pee o.\nNnu ndu' yaa si hα sǝ nkαα\nPen zα nnu, pen zα nnu e eee!",
            "Pen si popsi nkαα yee nehe o\nNα wuea, ndα ' wuzα mfhʉ'na\nPen zα nnu, pen zα nnu e eee!",
            "Pen sα ', mbe' wuzα sie le pi\nMben nǝ mα yaa mʉ ndamsak\nPen zα nnu, pen zα nnu e eee!",
            "Pen sα', mu bα ko nceh yee la o!\nα pen cak A, Mbα' yee lee\nPen zα nnu, pen zα nnu e eee!",
            "Pen sα' mbu A, n kα cǝ nzen mee o\nMbα' yee, ngα ghu mbe'nthu.\nα pen zα nnu, pen zα nnu e eee!"
        ]
    },
    {
        "numero": "11",
        "titre": "YU'A LE LEE",
        "reference": "Psaume 87",
        "refrain": "Yu' a le lee Yahwe, Shʉαpʉ na\nYu' a le lee, Yahwe",
        "couplets": [
            "Ngα yↄↄ ntak 0 lee, Yahwe\nShʉαpʉ na yu'a le lee Yahwe",
            "Shuαpu Mboo ma lee, wo bα ya Yahsi\nNgα mu ncwi mbu O e, Yahwe.",
            "A Lααsi zα kwen Tok O lee, Yahwe\nCo' Ntok mo nju' Ghe' za, Yahwe.",
            "Mbi'tu mα Yehni a loh mα Mbwen e\nVαh za si si' tα nshʉα Kuu lee, Yahwe.",
            "Ngα ya' co Mbok lee, Yahwe\nYa mimie mie lee, Yahwe"
        ]
    },
    {
        "numero": "12",
        "titre": "YAHWE KO LA E",
        "reference": "Offrande",
        "refrain": "Yahwe, Yahwe e ee\nMboo yoh, Sie yoh ko la e\nKo lα Yahwe ko lα e.",
        "couplets": [
            "Tehndoo yoh, Sie yoh ko lα e,\nSie Nkwe 'ni e, Sie yoh Ko la e\nKo la Yahwe ko la e",
            "Zu Po yoh, Sie yoh ko lα e\nPo' Nkwe' ni e, Sie yoh kα la e\nKo la Yahwe, ko lα e.",
            "Pαh lααsi 0, Sie yoh kα lα e\nNα Zen Yeso, Sie yoh ko lα e",
            "Sie nkwe Kame, Mboo yoh ko lα e\nNga'ngu' wa', pαh lah ŋamsi o e",
            "A yaa pe' 0 lee, Mboo yoh ko lα e\nA-yaa ku'ní o Mboo yoh ko lα e"
        ]
    },
    {
        "numero": "13",
        "titre": "SHɄAPɄ LA LƎƎ CAK YOH",
        "reference": "Communion",
        "refrain": "Shʉapʉ la lǝǝ Cak yoh\nNdǝǝ ntuα Ndu' yaa 0!",
        "couplets": [
            "A lα lah Mfhʉ'na I ta ndǝǝ\nNsi mi bα Ndu' yaa\nMbi nkwe Poomα a Nα nkwe' ni pʉ ncat",
            "Yeso lα Kwe' yoh\nMʉα nkwe'ni Poomα Τα nhα Na i na\nYaa zhie Ncααtom",
            "Yeso Menmα yoh\nYeso lα Cii yoh\nNcii mα Ghəə mi\nNcii mα Mfhʉ'na i",
            "Yee! Yee ŋh ŋh\nYee ŋh, yee ŋh ŋh\nYeso kwe' yoh!\nYeso Kwe' yoh!",
            "Nkwe'ni mα a ghα' Mbo Τα o\nPen Wuα nkuα\nTα pαh pe yoh\nNghu Vαhsimie e"
        ]
    },
    {
        "numero": "14",
        "titre": "ALLELUIA POH YO KAM",
        "reference": "Acclamation évangélique",
        "refrain": "Alleluia, Alleluia, Alleluia a a",
        "couplets": [
            "Pαh ya kam e, njo nah mben Fʉ yoh\nSie nkwe wu e,Fʉ nkwe poonzu mimie\nPαh yo kam e, njo nah mben Fʉ ngwe'\nNjↄ wupi, nzen mbα nshi Alleluia!",
            "Pαh pu' mbo, mbu' mbo mbi Fʉ yoh\nNjo nshi nah mben Shʉαpʉ Sie nkwe nu e\nPαh yↄ kam e, njↄ nah mben Fʉ ngwe'\nNjↄ wupi, nzen mbα nshi Alleluia!",
            "Pαh ca'si, nca'si mbi Fʉ yoh\nNkwe poonzu, nkwe mfα' ntumbo Shʉαpʉ\nPαh yↄ kam e, njↄ nah mben Fʉ ngwe'\nNjↄ wupi, nzen mbα nshi Alleluia!"
        ]
    },
    {
        "numero": "15",
        "titre": "NGΑ SΑ' TΑ NKWEN NDɄΑ O LEE",
        "reference": "Entrée",
        "refrain": "Ngα sα' tα nkwen ndʉα o lee\nShʉαpʉ Sie, yↄ nku'ni mo e e\nYayakam e mbi Shʉαpʉ Sie ngwe' wa'\nYayakam e, Alleluia",
        "couplets": [
            "Mbα mα nam mʉntʉα, mbα mα mbak mʉndo\nN kα yↄ nku'ni mo e e, Yayakam e, Alleluia!",
            "Mbα mα zʉ' mʉnsen, mbα mα zʉ' mʉndee\nNgα sα' yↄ kam zo e e, Yayakam e, Alleleuia!",
            "Mbα mα nzhi a mʉntom, mbα mα nzhi a mʉnsak\nN kα yↄ nja'nshi fi e, Yayakam e, Alleluia!",
            "Mbα mα see mʉnkwen, mbα mα lom nzhi nshʉa\nN kα cak Ndʉα o si' cak e, Yayakam e, Alleluia!",
            "Wen lα' tak Fʉ ngwα' Sie, N kα cak Ndʉα O\ntα ndα' nkuα N kα yo nku'ni mo e, Yayakam e Alleluia!"
        ]
    },
    {
        "numero": "16",
        "titre": "YII YOH LE LEE",
        "reference": "Entrée",
        "refrain": "Yii yoh le lee\nYii yoh le lee e ee\nShʉαpʉ Ndi yoh pαh sα' ku ni 0 e\nYii yoh le lee",
        "couplets": [
            "Shʉαpʉ Sie yoh, pαh bee Mbee no e\nPαh kα yoo bo, njoo bo Fʉ yoh e",
            "Lie'nzα yi Shʉαpʉ lα niα lα bee lee\nShʉαpʉ Lie Ca'si yoh mα wo bα nhα lee.",
            "Sie Nku'ni mbα Sie Kam mα n dα' Mboo yoh e.\nSie Fʉ yoh mca a gha'nshua nkwe Fʉ wa' e",
            "Shʉαpʉ Pαh mbα nat Nat siecα ndαα bo e.\nShʉαpʉ pαh mʉ ntoo Ngok nnah nku'ni 0 e.",
            "Mboo yoh Shʉαpʉ tα mα yʉα mα nghʉ yoh e.\nKa' mαnam mbα Siecα' Mfα' Ntumbo mi e."
        ]
    },
    {
        "numero": "17",
        "titre": "NGA PEN LEE",
        "reference": "Credo",
        "refrain": "Nga pen lee, mm nga pen bam bene,\nnga pen lee bi po mboo nshu,\nnga ngu wa, ngu nkwe wu,\nmm nga pen e.",
        "couplets": [
            "Nga pen lee, mbi mbah nga ngu wa;\npo mboonshu, ngu nkwe wu,",
            "Nga pen lee –YESO KRISTO- po' meni\nShuapu yoh é, yin di ngoo Maria\nlafak ma ngu Letia – Yeh nzii",
            "A layü nganga na lié' ponto pilato\npou cwü n inti mfa'a kwa,",
            "Pou lam ni fie lee, a fi wu pu ken tam\nsie la ndoo na wua na ntimbhi lie' taa",
            "A la ko' puh a si na mba' lom;\nta sa' la' nca' nkuwé é pu yi pou kua la;\nmba zi ka yat wu,",
            "Nga pen lee, mbi –Letia- Yehni-\na mboo ndinde ; ma nha vahe,",
            "Nga pen lee mbi nduamboo katolika;\nmbi kamsia paletia mba the ùusipe'e,",
            "Nga pen lee nga pen nu louna wua\nmben nu vah simie mm nga pen e."
        ]
    },
    {
        "numero": "18",
        "titre": "LAꞋZO MɄNTEN NCEH O",
        "reference": "",
        "refrain": "Shʉαpʉ yoh,lαʼzo mʉnten nceh o Lɛ lee.\nShʉαpʉ yoh,ngweʼ no mʉnten nceh O lee.\nNceh Sie I lee,Yahwe,pαh bee lee.",
        "couplets": [
            "Sie nkuʼni e, pαh mαnzhi nsαʼ lɛ lee\nFʉ pα Mfʉ e,pαh mαnzhi nsαʼ lαh bo.\nPαh nzhi nsαʼ e, di yoh lɛ lee.",
            "Pαh mʉ mbʉα nat sie,tα nah nkuʼni o e.\nSie nkwe nu e, yii mαnjweʼ zo lɛ lee.\nYii yoh lɛ lee, yii lαʼ zo e.",
            "Pαh kα yɔ ncaʼsi,mbiʼtumα o kweʼ yoh e.\nPαh kα yoh mbuʼ mbo, nah ndah Fʉ yoh e.\nPαh mʉnjɔ ntak o lee,yuʼ yoh lɛ lee.",
            "Sie Ndʉndam e, wα pαʼ wo lee?\nO mα Fʉ nkweʼni e,Fʉ mbuα ni e.\nFʉ kwaʼtom e, tα nsh̀ʉα nkwe Mfʉ waʼ e.",
            "Siʼ Mboo kwaŋ e, Sie Mboo yoh e.\nNkuʼni mbu O lα,Nkuʼni waʼ mbu o e.\nMʉαmʉα Nkuʼni si mvak,Mʉαmʉα Nkuʼni lee"
        ]
    },
    {
        "numero": "19",
        "titre": "PEN PO NZA LE",
        "reference": "",
        "refrain": "pen po' za lee shuapu mboo ma o;\nmboo ma ;zak ya na'la ha o;\nngopndoo na ta nga lah nsa' shu' le lee;\nmboo ma,pen ya po'bee le nha a lee.",
        "couplets": [
            "A yo'si ba ma wo shuapu,sie fu,\nngapndoo na ta nga lah sa' ngah cap le;\nmo souwa,soh ya fensi na o;\nmbo ma, pen ya po' bee le nha a lee.",
            "Nga mbo ma' cuco' mboo ma lee,\nya nu mbé ma yaa yee ntuntu o,\nsia lè nga' mbuè na lao siè o,\nmboo ma o si pen ma zob ba lé",
            "Wuza ma yaa to ntam ca'o,\npi ndu' ma yaa tom ntam nkua o,\nnkwe yaa ta nga lah nsa' ha lè lé;\nmboo ma nga laasio si gha' lé",
            "Na sié ndindé ta nga lah sà shu le lé,\nmbo' na pi nsina yeso,\nna sié ma ya shue nkwe nào;\nmbo ma nza laa ha nga tok lé"
        ]
    },
    {
        "numero": "20",
        "titre": "YAHWE O MA MBO MA",
        "reference": "",
        "refrain": "yahwe o ma mboo ma vahmimie za,\nw oba ntia ya no'nkaa ta nha a lee;\nyahwe, o ma mboo ma, vahmimie za;\nya ntaa mba ya zu'luu sie mboo ma lee!",
        "couplets": [
            "pen ka pee na yee si'pee ta sena ba?\npen ka pee mensi went a sena ba e?\nnshu yee mundamsak ta,ta nthu yee ka' lee;\nnda' ma shuapu ten njam manjiii nkwe yaa.",
            "mba'ntam a o si ce lee,ne 'zo ndie,\nshuapu ma ya mvu'loh ya lohsam e;\nshuapu siemba ya ntaa,yayakam e,\nshuapu na ba ya ngu,sie mboo ma lee."
        ]
    },
]

# ─── Génération des PDF ───────────────────────────────────────────────────────

def generer_pdf(chant, dossier_sortie):
    """Génère un fichier PDF pour un chant donné."""
    nom_fichier = f"{chant['numero']}_{chant['titre'].replace(' ', '_').replace('/', '-')[:40]}.pdf"
    chemin = os.path.join(dossier_sortie, nom_fichier)

    doc = SimpleDocTemplate(
        chemin,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()

    style_numero = ParagraphStyle(
        'Numero',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    style_titre = ParagraphStyle(
        'Titre',
        parent=styles['Title'],
        fontSize=18,
        textColor=colors.HexColor('#1a1a2e'),
        alignment=TA_CENTER,
        spaceAfter=4,
        fontName='Helvetica-Bold',
    )
    style_reference = ParagraphStyle(
        'Reference',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER,
        spaceAfter=16,
        fontName='Helvetica-Oblique',
    )
    style_label = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#8B4513'),
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=4,
    )
    style_refrain = ParagraphStyle(
        'Refrain',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#2c3e50'),
        fontName='Helvetica-Oblique',
        alignment=TA_LEFT,
        spaceAfter=8,
        leftIndent=20,
        leading=16,
    )
    style_couplet_label = ParagraphStyle(
        'CoupletLabel',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#27ae60'),
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=2,
    )
    style_couplet = ParagraphStyle(
        'Couplet',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#2c3e50'),
        alignment=TA_LEFT,
        spaceAfter=6,
        leftIndent=20,
        leading=16,
    )

    contenu = []

    # Numéro
    contenu.append(Paragraph(f"Chant N° {chant['numero']}", style_numero))

    # Titre
    contenu.append(Paragraph(chant['titre'], style_titre))

    # Référence biblique
    if chant['reference']:
        contenu.append(Paragraph(chant['reference'], style_reference))

    contenu.append(Spacer(1, 0.3*cm))

    # Refrain
    contenu.append(Paragraph("REFRAIN", style_label))
    refrain_html = chant['refrain'].replace('\n', '<br/>')
    contenu.append(Paragraph(refrain_html, style_refrain))

    # Couplets
    for i, couplet in enumerate(chant['couplets'], 1):
        contenu.append(Paragraph(f"{i}.", style_couplet_label))
        couplet_html = couplet.replace('\n', '<br/>')
        contenu.append(Paragraph(couplet_html, style_couplet))

    doc.build(contenu)
    print(f"✅ Généré : {nom_fichier}")


def main():
    dossier_sortie = "chants_pdf"
    os.makedirs(dossier_sortie, exist_ok=True)

    print(f"📁 Génération de {len(chants)} PDF dans le dossier '{dossier_sortie}/'...\n")

    for chant in chants:
        try:
            generer_pdf(chant, dossier_sortie)
        except Exception as e:
            print(f"❌ Erreur pour {chant['titre']} : {e}")

    print(f"\n🎵 Terminé ! {len(chants)} PDF générés dans '{dossier_sortie}/'")


if __name__ == "__main__":
    main()
