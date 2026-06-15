// ??????????????????????????????
const GameData = {
    programThemes: {
        entertainment: '🎭 娱乐',
        news: '📰 新闻',
        medical: '🏥 医疗',
        comfort: '💚 安抚',
        warning: '⚠️ 预警',
        knowledge: '📚 知识',
        weather: '🌤️ 天气',
        emergency: '🚨 紧急'
    },

    audienceGroups: {
        workers: { name: '👷 工人', icon: '👷' },
        patients: { name: '🏥 病人', icon: '🏥' },
        refugees: { name: '🏠 避难者', icon: '🏠' },
        elders: { name: '👴 老人', icon: '👴' },
        children: { name: '👶 儿童', icon: '👶' },
        medicalStaff: { name: '⚕️ 医护', icon: '⚕️' },
        general: { name: '👥 普通市民', icon: '👥' }
    },

    timeSlots: {
        morning: {
            id: 'morning',
            name: '🌅 早间时段',
            hours: '06:00-12:00',
            desc: '清晨时段，人们准备开始一天的活动'
        },
        afternoon: {
            id: 'afternoon',
            name: '☀️ 午间时段',
            hours: '12:00-18:00',
            desc: '中午时段，人们在工作或休息'
        },
        evening: {
            id: 'evening',
            name: '🌙 晚间时段',
            hours: '18:00-24:00',
            desc: '夜晚时段，人们放松休息'
        }
    },

    districtTypes: {
        hospital: {
            id: 'hospital',
            name: '医院周边',
            icon: '🏥',
            desc: '医疗资源集中区域，病人和医护人员较多',
            primaryAudience: ['patients', 'medicalStaff', 'elders'],
            preferredThemes: ['medical', 'comfort', 'news'],
            dislikedThemes: ['entertainment', 'warning']
        },
        shelter: {
            id: 'shelter',
            name: '避难所区',
            icon: '🏠',
            desc: '临时避难所，聚集大量无家可归的幸存者',
            primaryAudience: ['refugees', 'children', 'elders'],
            preferredThemes: ['comfort', 'news', 'entertainment'],
            dislikedThemes: ['warning', 'emergency']
        },
        industrial: {
            id: 'industrial',
            name: '工业区',
            icon: '🏭',
            desc: '工厂和生产区域，工人集中',
            primaryAudience: ['workers', 'general'],
            preferredThemes: ['warning', 'news', 'weather'],
            dislikedThemes: ['entertainment', 'comfort']
        },
        residential: {
            id: 'residential',
            name: '居民区',
            icon: '🏘️',
            desc: '普通市民居住区域',
            primaryAudience: ['general', 'elders', 'children'],
            preferredThemes: ['news', 'entertainment', 'comfort'],
            dislikedThemes: []
        },
        downtown: {
            id: 'downtown',
            name: '市中心',
            icon: '🏙️',
            desc: '城市中心区域，各类人群混合',
            primaryAudience: ['general', 'workers', 'medicalStaff'],
            preferredThemes: ['news', 'knowledge', 'weather'],
            dislikedThemes: []
        }
    },

    audienceSchedule: {
        morning: {
            workers: 0.9,
            patients: 0.5,
            refugees: 0.6,
            elders: 0.8,
            children: 0.4,
            medicalStaff: 0.7,
            general: 0.7
        },
        afternoon: {
            workers: 0.3,
            patients: 0.7,
            refugees: 0.8,
            elders: 0.6,
            children: 0.7,
            medicalStaff: 0.4,
            general: 0.5
        },
        evening: {
            workers: 0.8,
            patients: 0.8,
            refugees: 0.9,
            elders: 0.9,
            children: 0.8,
            medicalStaff: 0.6,
            general: 0.9
        }
    },

    themePreferenceMultiplier: {
        preferred: 1.5,
        neutral: 1.0,
        disliked: 0.5
    },

    programTypes: [
        { id: 'music', name: '🎵 音乐节目', themes: ['entertainment', 'comfort'], effects: { morale: 5, noise: 3, fatigue: -2 }, power: 5, desc: '播放轻松音乐' },
        { id: 'news', name: '📰 新闻播报', themes: ['news', 'knowledge'], effects: { morale: 3, rumor: -5, trust: 5 }, power: 8, desc: '播报真实新闻' },
        { id: 'story', name: '📖 故事时间', themes: ['entertainment', 'comfort'], effects: { morale: 8, fatigue: -5 }, power: 4, desc: '讲述精彩故事' },
        { id: 'education', name: '📚 知识讲座', themes: ['knowledge', 'medical'], effects: { morale: 4, trust: 8 }, power: 6, desc: '科普生存知识' },
        { id: 'interview', name: '🎙️ 幸存者访谈', themes: ['news', 'comfort'], effects: { morale: 6, trust: 10, rumor: -8 }, power: 10, desc: '采访幸存者' },
        { id: 'weather', name: '🌤️ 天气预报', themes: ['weather', 'warning'], effects: { morale: 2, trust: 3 }, power: 3, desc: '播报天气情况' },
        { id: 'silent', name: '🔇 静默时段', themes: [], effects: { fatigue: -10, noise: -10 }, power: 1, desc: '关闭广播休息' },
        { id: 'emergency', name: '🚨 紧急广播', themes: ['emergency', 'warning', 'news'], effects: { morale: -5, rumor: -15, trust: 15 }, power: 15, desc: '发布紧急通知' }
    ],

    questionBank: [
        {
            question: '听众问："外面的辐射情况怎么样了？我想出去寻找物资。"',
            options: [
                { text: '目前辐射较高，建议等待几日再行动', correct: true, effects: { trust: 5, morale: -2 } },
                { text: '辐射已经很安全了，随时可以出去', correct: false, effects: { trust: -10, rumor: 10 } },
                { text: '不清楚，你们自己看着办吧', correct: false, effects: { trust: -5, morale: -3 } }
            ]
        },
        {
            question: '听众问："听说东边的避难所有充足的食物，这是真的吗？"',
            options: [
                { text: '我们正在核实，请勿轻信谣言', correct: true, effects: { trust: 5, rumor: -5 } },
                { text: '没错，大家赶紧往东边去！', correct: false, effects: { trust: -15, rumor: 15, morale: -10 } },
                { text: '那边是陷阱，千万别去！', correct: false, effects: { trust: -8, rumor: 5 } }
            ]
        },
        {
            question: '听众问："饮用水应该怎么处理才安全？"',
            options: [
                { text: '建议煮沸后再饮用，或使用净水片', correct: true, effects: { trust: 8, morale: 3 } },
                { text: '看起来干净的水可以直接喝', correct: false, effects: { trust: -10, morale: -5 } },
                { text: '我不是专家，不知道', correct: false, effects: { trust: -3 } }
            ]
        },
        {
            question: '听众问："我的家人还在外面，我应该去找他们吗？"',
            options: [
                { text: '请先保持冷静，我们可以帮你广播寻人', correct: true, effects: { morale: 5, trust: 10 } },
                { text: '别去找了，他们肯定已经...', correct: false, effects: { morale: -15, trust: -10 } },
                { text: '赶紧去，晚了就来不及了！', correct: false, effects: { morale: -5, rumor: 5 } }
            ]
        },
        {
            question: '听众问："晚上总是听到奇怪的声音，是怪物吗？"',
            options: [
                { text: '可能是风声或建筑晃动，保持警惕但不必恐慌', correct: true, effects: { morale: 3, rumor: -8 } },
                { text: '是的！很危险，大家要小心！', correct: false, effects: { rumor: 15, morale: -10 } },
                { text: '我也听到了，太可怕了...', correct: false, effects: { rumor: 10, morale: -8 } }
            ]
        },
        {
            question: '听众问："什么时候才能恢复正常生活？"',
            options: [
                { text: '我们正在努力，保持希望，互相帮助', correct: true, effects: { morale: 10, trust: 5 } },
                { text: '永远不可能了，接受现实吧', correct: false, effects: { morale: -20, trust: -15 } },
                { text: '再过一个月就好了，我保证', correct: false, effects: { trust: -10, rumor: 5 } }
            ]
        },
        {
            question: '听众问："电池快用完了，有什么省电的方法吗？"',
            options: [
                { text: '关闭不必要的设备，改用手动照明', correct: true, effects: { trust: 8, morale: 2 } },
                { text: '尽情用吧，没电了再说', correct: false, effects: { trust: -5 } },
                { text: '可以用人力发电机，锻炼身体', correct: true, effects: { trust: 6, morale: 3 } }
            ]
        },
        {
            question: '听众问："有人说政府已经抛弃我们了，是真的吗？"',
            options: [
                { text: '目前没有官方消息，请不要传播未经证实的信息', correct: true, effects: { rumor: -10, trust: 8 } },
                { text: '是的，我们只能靠自己了', correct: false, effects: { rumor: 10, morale: -15 } },
                { text: '政府很快会来救我们的，耐心等待', correct: false, effects: { trust: -8, rumor: 5 } }
            ]
        },
        {
            question: '听众问："孩子一直哭，我该怎么安抚他？"',
            options: [
                { text: '抱着他轻声说话，给他讲故事', correct: true, effects: { morale: 8, trust: 5 } },
                { text: '让他哭，哭累了就好了', correct: false, effects: { morale: -5, trust: -3 } },
                { text: '给他点吃的，转移注意力', correct: true, effects: { morale: 5, trust: 3 } }
            ]
        },
        {
            question: '听众问："我发烧了，是不是被感染了？"',
            options: [
                { text: '先隔离观察，多喝水，如有其他症状及时告知', correct: true, effects: { trust: 10, rumor: -5 } },
                { text: '完了，你肯定被感染了！', correct: false, effects: { rumor: 15, morale: -10 } },
                { text: '别担心，只是普通感冒', correct: false, effects: { trust: -5, rumor: 8 } }
            ]
        }
    ],

    broadcastMessages: [
        { id: 'safe_zone', title: '📍 安全区通知', themes: ['news', 'comfort'], content: '城西区已确认安全，幸存者可前往临时避难所。', effects: { morale: 8, trust: 10, rumor: -5 }, power: 10 },
        { id: 'food_depot', title: '🍞 物资发放', themes: ['news', 'comfort'], content: '今日下午三点在中心广场发放应急物资，请携带身份证明。', effects: { morale: 12, trust: 8 }, power: 8 },
        { id: 'danger_warning', title: '⚠️ 危险警告', themes: ['warning', 'emergency', 'news'], content: '工业区发现不明泄漏，请所有居民远离该区域。', effects: { morale: -3, trust: 15, rumor: -10 }, power: 12 },
        { id: 'rescue_team', title: '🚑 救援队消息', themes: ['news', 'comfort', 'medical'], content: '搜救队已救出12名被困幸存者，正在送往医疗点。', effects: { morale: 15, trust: 12 }, power: 8 },
        { id: 'water_supply', title: '💧 供水恢复', themes: ['news', 'comfort'], content: '城东片区供水已恢复，请节约用水。', effects: { morale: 10, trust: 8 }, power: 6 },
        { id: 'curfew', title: '🌙 宵禁通知', themes: ['warning', 'news'], content: '今晚十点至明日六点实行宵禁，请勿外出。', effects: { morale: -5, trust: 5, rumor: 5 }, power: 5 },
        { id: 'missing_person', title: '🔍 寻人启事', themes: ['news', 'comfort'], content: '寻找5岁女童小雨，穿红色外套，知情者请联系广播站。', effects: { morale: 3, trust: 10 }, power: 7 },
        { id: 'weather_alert', title: '🌪️ 天气预警', themes: ['weather', 'warning'], content: '预计明日有强暴雨，请做好防护准备。', effects: { morale: -2, trust: 12 }, power: 6 },
        { id: 'medical_help', title: '🏥 医疗援助', themes: ['medical', 'comfort', 'news'], content: '临时医疗点24小时开放，有需要的居民可前往就诊。', effects: { morale: 8, trust: 10 }, power: 7 },
        { id: 'power_restore', title: '⚡ 电力恢复', themes: ['news', 'comfort'], content: '城南片区今晚八点恢复供电。', effects: { morale: 12, trust: 10 }, power: 5 }
    ],

    equipmentList: [
        { id: 'transmitter', name: '📡 主发射器', condition: 85, maxCondition: 100, repairCost: 3, repairTime: 2, effect: '广播范围' },
        { id: 'antenna', name: '📶 信号天线', condition: 70, maxCondition: 100, repairCost: 2, repairTime: 1, effect: '信号强度' },
        { id: 'generator', name: '🔋 备用发电机', condition: 90, maxCondition: 100, repairCost: 4, repairTime: 2, effect: '电力供应' },
        { id: 'mixer', name: '🎚️ 音频控制台', condition: 75, maxCondition: 100, repairCost: 2, repairTime: 1, effect: '音质效果' },
        { id: 'ups', name: '🔌 UPS电源', condition: 65, maxCondition: 100, repairCost: 3, repairTime: 1, effect: '电力稳定' }
    ],

    districts: [
        { id: 'east', name: '城东', type: 'industrial', trust: 60 },
        { id: 'west', name: '城西', type: 'shelter', trust: 50 },
        { id: 'south', name: '城南', type: 'residential', trust: 55 },
        { id: 'north', name: '城北', type: 'hospital', trust: 45 },
        { id: 'center', name: '市中心', type: 'downtown', trust: 70 }
    ],

    survivorNames: ['李明', '王芳', '张伟', '刘洋', '陈静', '杨帆', '赵磊', '周婷', '吴强', '郑雪'],
    survivorSkills: ['维修', '医疗', '电力', '通讯', '搜索']
};
