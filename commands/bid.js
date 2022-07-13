const { BIDDER_ROLE_ID } = require('../modules/config');

module.exports = {
    data: {
        name: "bid",
        description: "Đấu giá người chơi đang được sale!",
        options: [{
            name: "amount",
            type: "INTEGER",
            description: "Số điểm dùng để cược",
            required: true,
        }],
    },
    handler: async () => {
        // Logic is handled in newsale.js via an InteractionCollector
        // TODO find a way for bid not to do anything unless an auction is active
    },
}
