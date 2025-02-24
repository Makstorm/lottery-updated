const ganache = require('ganache');
const { Web3 } = require('web3');
const assert = require('assert')

const web3 = new Web3(ganache.provider())

const { abi, evm } = require('../compile');
const { describe, beforeEach, it } = require('mocha');

let lottery;
let accounts;



describe('Lottery Contract', () => {
    beforeEach(async () => {
        accounts = await web3.eth.getAccounts()
        lottery = await new web3.eth.Contract(abi)
            .deploy({ data: evm.bytecode.object })
            .send({ from: accounts[0], gas: '1000000' })
    })


    it('deploys a contract', () => {
        assert.ok(lottery.options.address)
    })

    it('allows one account to enter', async () => {
        await lottery.methods.enter()
            .send({
                from: accounts[0],
                value: web3.utils.toWei('0.02', 'ether')
            })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0])
        assert.equal(1, players.length)
    })

    it('allows multiple account to enter', async () => {
        await lottery.methods.enter()
            .send({
                from: accounts[0],
                value: web3.utils.toWei('0.02', 'ether')
            })
        await lottery.methods.enter()
            .send({
                from: accounts[1],
                value: web3.utils.toWei('0.02', 'ether')
            })
        await lottery.methods.enter()
            .send({
                from: accounts[2],
                value: web3.utils.toWei('0.02', 'ether')
            })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0])
        assert.equal(accounts[1], players[1])
        assert.equal(accounts[2], players[2])
        assert.equal(3, players.length)
    })

    it('requires a minimum amount to ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 10
            })
            assert(false)
        } catch (err) {
            assert(err)
        }
    })

    it('only manager can call pickWinner', async () => {
        try {
            await lottery.methods.pickWinner()
                .send({
                    from: accounts[1]
                })
            assert(false)
        } catch (err) {
            assert(err)
        }
    })


    it('sends money to a winner and resets contract', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', "ether")
        })

        const initialBalance = await web3.eth.getBalance(accounts[0])

        await lottery.methods.pickWinner().send({ from: accounts[0] })

        const finalBalance = await web3.eth.getBalance(accounts[0])

        const difference = finalBalance - initialBalance

        assert(difference > web3.utils.toWei(1.8, 'ether'))
    })
})
