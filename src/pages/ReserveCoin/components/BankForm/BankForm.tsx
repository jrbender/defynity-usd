import React, { Component } from 'react';
import cn from 'classnames';
import InfoModal from 'components/InfoModal/InfoModal';
import WalletModal from 'components/WalletModal/WalletModal';
import { toast } from 'react-toastify';
import { generateUniqueId } from 'utils/utils';
import Card from '../../../../components/Card/Card';
import Switch from '../../../../components/Switch/Switch';
import { ergCoin, reserveAcronym, reserveName, usdName } from '../../../../utils/consts';
import { feeToMintRc, maxRcToMint, priceToMintRc, amountFromRedeemingRc, feeFromRedeemingRc, maxRcToRedeem } from '../../../../utils/ageHelper';
import { isNatural } from '../../../../utils/serializer';
import Loader from '../../../../components/Loader/Loader';
import { isWalletSaved } from '../../../../utils/helpers';
import { mintRc } from '../../../../utils/mintRc';
import { currentHeight } from '../../../../utils/explorer';

import { redeemRc } from '../../../../utils/redeemRc';

//need to export one thing - the bank form...set flags from button to know what action is taking place

export class BankForm extends Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            //purchase components
            loading: false,
            curHeight: NaN,
            
            //redeem components
            isModalOpen: false,

            //shared components
            requestId: null,
            inputChangeTimerId: null,
            address: '',
            errMsg: '',
            amount: '',
            amount1: '',
            amount2:'',
            dueTime: null,
            ErgVal:0,
            ErgFee:0,
            payReceiveErgVal:0,

            //flags - need to think about what the default option will be
            purchaseFlag: true,
            redeemFlag: false,
            inCoin: ergCoin, 
            outCoin: reserveAcronym,
            payReceiveString: 'pay',
            purchaseRedeemString:'Purchase',
            zeroString: '',
            bgColor1: '#2d2d2d', //or do #hex values
            bgColor2:'',
        };
    }

    //not sure what this is but it's only on purchase - should be fine
    componentDidMount() {
        currentHeight().then((height) => this.setState({ curHeight: height }));
    }
    
    //shared
    componentWillUnmount() {
        clearTimeout(this.state.inputChangeTimerId);
    }

    //combined isinputinvalid
    isInputInvalid(inp: number, requestId: string) {
        //if purchase
        if ((this.state.purchaseFlag === true) && (this.state.redeemFlag === false)) {
            if (!this.state.curHeight) {
                this.setState({
                    errMsg: '',
                });
                return;
            }

            maxRcToMint(this.state.curHeight).then((maxAllowed) => {
                if (this.state.requestId !== requestId) {
                    return;
                }

                if (maxAllowed < inp) {
                    this.setState({
                        errMsg: `Unable to mint more than ${maxAllowed} ${reserveName} based on the current reserve status`,
                    });
                    return;
                }

                this.setState({
                    errMsg: '',
                });
            });
        }

        //if redeem
        if ((this.state.purchaseFlag === false) && (this.state.redeemFlag === true)) {
            maxRcToRedeem().then((maxAllowed) => {
                if (this.state.requestId !== requestId) {
                    return;
                }

                if (maxAllowed < inp) {
                    this.setState({
                        errMsg: `Unable to redeem more than ${maxAllowed} ${reserveName} based on the current reserve status`,
                    });
                    return;
                }

                this.setState({
                    errMsg: '',
                });
            });
        }
    }

    //combined params
    updateParams(amount: any, requestId: string) {
        if (!amount || !amount.trim()) {
            this.setState({
                ErgVal: 0,
                ErgFee: 0,
                payReceiveErgVal: 0,
            });
            return;
        }
        //purchase
        if ((this.state.purchaseFlag === true) && (this.state.redeemFlag === false)) {
            Promise.all([priceToMintRc(amount), feeToMintRc(amount)]).then(([tot, fee]) => {
                if (this.state.requestId === requestId) {
                    this.setState({
                        ErgFee: fee / 1e9,
                        ErgVal: (tot - fee) / 1e9,
                        payReceiveErgVal: tot / 1e9,
                    });
                }
            });
        }

        //redeem
        if ((this.state.purchaseFlag === false) && (this.state.redeemFlag === true)) {
            Promise.all([amountFromRedeemingRc(amount), feeFromRedeemingRc(amount)]).then(
                ([tot, fee]) => {
                    if (this.state.requestId === requestId) {
                        this.setState({
                            ErgFee: fee / 1e9,
                            ErgVal: (tot + fee) / 1e9,
                            payReceiveErgVal: tot / 1e9,
                        });
                    }
                },
            );
        }
    }

    //shared function with if statements inside
    inputChange(inp: string) {
        clearTimeout(this.state.inputChangeTimerId);

        if (!isNatural(inp) || inp.startsWith('-')) return;

        const timerId = setTimeout(() => {
            const requestId = generateUniqueId();
            this.setState({ requestId });
            this.isInputInvalid(parseInt(inp), requestId);
            this.updateParams(inp, requestId);
        }, 200);

        this.setState({ amount: inp, inputChangeTimerId: timerId });
    }

    //redeem functions
    startRcInteraction() {
        if (!isWalletSaved()) {
            toast.warn('Please set up your wallet first.');
            this.setState({ isWalletModalOpen: true });
            return;
        }
        this.setState({ loading: true });
        
        //if redeem
        if ((this.state.purchaseFlag === false) && (this.state.redeemFlag === true)) {
            redeemRc(this.state.amount)
                .then((res) => {
                    this.setState({
                        address: res.addr,
                        coin: reserveName,
                        price: this.state.amount,
                        isModalOpen: true,
                        loading: false,
                        mintNanoErgVal: 0,
                        dueTime: res.dueTime,
                    });
                })
                .catch((err) => {
                    let { message } = err;
                    if (!message) message = err;
                    toast.error(`Could not register the request.\n${message}`);
                    this.setState({ loading: false });
                });
        }

        //if purchase
        if ((this.state.purchaseFlag === true) && (this.state.redeemFlag === false)) {
            mintRc(this.state.amount)
                .then((res) => {
                    this.setState({
                        address: res.addr,
                        coin: ergCoin,
                        price: res.price / 1e9,
                        isModalOpen: true,
                        loading: false,
                        mintNanoErgVal: 0,
                        dueTime: res.dueTime,
                    });
                })
                .catch((err) => {
                    toast.error(`Could not register the request.${err.message}`);
                    this.setState({ loading: false });
                });
        }
    }

    render() {
        return (
            <Card>
                <div className = "btn-row">
                <div className = "btn-column1">
                    <button
                        className="btn-choice"
                        onClick={() => {
                            this.setState({
                                purchaseFlag: true,
                                redeemFlag: false,
                                inCoin: ergCoin,
                                outCoin: reserveAcronym,
                                payReceiveString: 'pay',
                                purchaseRedeemString: 'Purchase'})

                            this.inputChange(this.state.zeroString);
                        }}
                        >Purchase
                    </button>
                </div>
                <div className = "btn-column2">
                    <button
                        className="btn-choice"
                        onClick={() => {
                            this.setState({
                                purchaseFlag: false,
                                redeemFlag: true, 
                                inCoin: reserveAcronym,
                                outCoin: ergCoin,
                                payReceiveString: 'receive',
                                purchaseRedeemString: 'Redeem'})
                            
                            this.inputChange(this.state.zeroString);
                        }}
                        >Redeem
                    </button>
                </div>
                </div>
                <Switch leftSide= {this.state.inCoin} rightSide={this.state.outCoin} />
                <div className="delimiter" />
                <div className="input mt-xl-20 mb-xl-20 mt-15 mb-15 mt-lg-20 mb-lg-20">
                    <div className="input-group">
                        <input
                            value={this.state.amount}
                            step="1"
                            onChange={(e) => {
                                this.inputChange(e.target.value);
                            }}
                            type="number"
                            placeholder="Amount (SigRSV)"
                        />
                    </div>
                    <span
                        className={cn('input__subtext', {
                            error: this.state.errMsg,
                        })}
                    >
                        {this.state.errMsgf
                            ? this.state.errMsg
                            : 'A fee is charged for currency conversion'}
                    </span>
                </div>
                <div className="delimiter" />
                <div className="terms">
                    <p>
                        {this.state.amount} {reserveAcronym} ≈ {this.state.ErgVal.toFixed(3)}{' '}
                        ERG
                    </p>
                    <p>Fee ≈ {this.state.ErgFee.toFixed(3)} ERG </p>
                    <p>
                        You will {this.state.payReceiveString} ≈{' '}
                        {this.state.payReceiveErgVal.toFixed(3)} ERG{' '}
                    </p>
                </div>
                <button
                    onClick={() => this.startRcInteraction()}
                    disabled={this.state.loading || this.state.errMsg || !this.state.amount}
                    className="mt-sm-15 mt-xl-40 mt-lg-25 btn btn--white"
                >
                    {this.state.loading ? <Loader /> : this.state.purchaseRedeemString}
                </button>
                <InfoModal
                    coin={this.state.coin}
                    address={this.state.address}
                    value={this.state.price}
                    open={this.state.isModalOpen}
                    onClose={() => this.setState({ isModalOpen: false })}
                    dueTime={this.state.dueTime}
                />
                <WalletModal
                    onClose={() => this.setState({ isWalletModalOpen: false })}
                    open={this.state.isWalletModalOpen}
                />
            </Card>
        );
    }

}
export default BankForm;