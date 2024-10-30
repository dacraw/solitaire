class Deck {
  constructor(board) {
    this.board = board;
    this.cards = this.generate();
    this.drawnCards = [];
    this.DOMElement = document.querySelector("#deck");

    this.shuffle();
    this.setEventHandler();
  }

  generate() {
    const deck = [];

    let cardId = 0;
    cardSuits.forEach((suit) => {
      Object.keys(cardValues).forEach((value) => {
        const card = new Card(value, suit, cardId, this.board);

        deck.push(card);
        cardId++;
      });
    });

    return deck;
  }

  shuffle() {
    const deck = this.cards;
    const shuffledDeck = [];

    while (deck.length > 0) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const randomCard = deck.splice(randomIndex, 1);
      shuffledDeck.push(randomCard[0]);
    }

    this.cards = shuffledDeck;
  }

  drawCards() {
    const cardsCopy = [...this.cards];

    const drawnCardsElement = document.querySelector("#drawn-cards");

    const drawnCardBatchElement = document.createElement("div");
    drawnCardBatchElement.classList.add("drawn-cards-batch");

    for (let i = 0; i < 3; i++) {
      const drawnCard = cardsCopy.shift();
      if (drawnCard) {
        drawnCard.drawnCard = true;
        drawnCard.flipped = true;

        drawnCard.DOMElement.style.position = "absolute";
        drawnCard.DOMElement.style.left = `-${i * 25}px`;
        drawnCardBatchElement.append(drawnCard.DOMElement);

        this.drawnCards.push(drawnCard);
      }
    }

    this.drawnCards.forEach((card) => {
      card.topOfDrawnCards = false;

      if (this.board.selectedCard) {
        this.board.deselectCard();
      }
    });
    this.drawnCards[this.drawnCards.length - 1].topOfDrawnCards = true;

    drawnCardsElement.append(drawnCardBatchElement);

    this.cards = cardsCopy;

    if (!this.cards.length) {
      document.querySelector("#deck .deck-card").style.display = "none";
      document.querySelector("#reset-deck").style.display = "block";
    }
  }

  setEventHandler() {
    this.DOMElement.addEventListener("click", () => {
      this.cards.length ? this.drawCards() : this.reset();
    });
  }

  reset() {
    this.drawnCards.forEach((card) => {
      card.DOMElement.remove();
    });
    this.cards = this.drawnCards;
    this.drawnCards = [];

    document.querySelector("#reset-deck").style.display = "none";
    document.querySelector("#deck .deck-card").style.display = "block";
  }
}

class Board {
  constructor() {
    this.deck = new Deck(this);
    this.finalCardPiles = this.setFinalCardPiles();
    this.drawnCards = [];
    this.topCardColumns = {};

    this.setTopCards();
  }

  // playCardInPile(pileId) {
  //   if (!this.selectedCard) return;

  //   // add the selected card to the pile
  //   const pile = this.finalCardPiles.find((pile) => pile.id === pileId);
  //   const { cards } = pile;

  //   // first, if the pile is empty then allow only an "A" to be played
  //   if (cards.length === 0 && this.selectedCard.rank !== "A") {
  //     return;
  //   }

  //   // if the pile has cards in it, only allow a card rank that is 1 rank higher to be played
  //   const lastCardInPile = cards[cards.length - 1];
  //   if (lastCardInPile) {
  //     // if the selected card isn't the same suit, prevent it from being played
  //     if (this.selectedCard.suit !== lastCardInPile.suit) return;

  //     const rankDifference =
  //       cardValues[this.selectedCard.rank] - cardValues[lastCardInPile.rank];
  //     if (rankDifference !== 1) return;
  //   }

  //   pile.addCardToPile(this.selectedCard);
  // }

  setTopCards() {
    const deck = this.deck.cards;

    // Set the cards in the top columns
    for (let i = 1; i <= 7; i++) {
      this.topCardColumns[i] = new TopCardColumn(i, deck.splice(0, i), this);
    }
  }

  // setTopCardColumn(cards, columnNumber) {
  //   const cardColumn = [];

  //   cards.forEach((card, idx) => {
  //     card.columnNumber = columnNumber;
  //     card.flipped = idx === cards.length - 1 ? true : false;

  //     cardColumn.push({
  //       card,
  //     });
  //   });
  //   return cardColumn;
  // }

  setFinalCardPiles() {
    const finalPiles = document.querySelectorAll(".final-card-pile");

    const pileInstances = [];
    finalPiles.forEach((pile, idx) => {
      pileInstances.push(new FinalCardPile(idx, pile, this));
    });

    return pileInstances;
  }

  selectCard(selectedCard) {
    // prevent user from selecting an unflipped card
    if (!selectedCard.flipped) return;

    // prevent cards in the final piles from being selected
    if (selectedCard.inPile) return;

    // only the top drawn card should be able to be selected
    if (selectedCard.drawnCard && !selectedCard.topOfDrawnCards) return;

    if (this.selectedCard) {
      // deselect the selected card if the user clicks it again
      if (selectedCard === this.selectedCard) return this.deselectCard();

      // return early so the user cannot select additional cards while one is selected
      return;
    }

    this.selectedCard = selectedCard;
    this.selectedCard.DOMElement.classList.add("card-selected");
  }

  deselectCard() {
    this.selectedCard.DOMElement.classList.remove("card-selected");
    this.selectedCard = null;
  }

  // showColumnLastCard(columnNumber) {
  //   const columnCards = this.topCardColumns[columnNumber];

  //   columnCards[columnCards.length - 1].card.show();
  // }

  // renderTopCardColumn(colId) {
  //   const cards = this.topCardColumns[colId].cards;

  //   cards.forEach((card, idx) => {
  //     if (idx !== 0) {
  //       card.DOMElement.style.position = "relative";
  //       card.DOMElement.style.top = `-${idx * 75}px`;
  //     }

  //     document
  //       .querySelector(`#top-card-column-${colId}`)
  //       .append(card.DOMElement);
  //   });
  // }

  cardCanBePlayed(selectedCard, cardPlayedOn) {
    return true;
    const selectedCardValue = cardValues[selectedCard.rank];
    const selectedCardColor = selectedCard.color;

    // if there isn't a card being played on, it's because a column is empty
    if (!cardPlayedOn && selectedCard.rank !== "K") {
      return false;
    }

    const cardPlayedOnValue = cardValues[cardPlayedOn.rank];
    const cardPlayedOnColor = cardPlayedOn.color;

    // compare the suits of the selected/playable card to determine whether a play is eligible
    if (
      (selectedCardColor === CARD_COLORS.red &&
        cardPlayedOnColor === CARD_COLORS.red) ||
      (selectedCardColor === CARD_COLORS.black &&
        cardPlayedOnColor === CARD_COLORS.black)
    ) {
      return false;
    }

    const valueDifference = cardPlayedOnValue - selectedCardValue;
    if (valueDifference !== 1) {
      return false;
    }

    return true;
  }
}

const cardSuits = ["&heartsuit;", "&spadesuit;", "&clubsuit;", "&diamondsuit;"];
const cardValues = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
};
const CARD_COLORS = {
  red: "RED",
  black: "BLACK",
};

class Card {
  constructor(rank, suit, id, board) {
    this.rank = rank;
    this.suit = suit;
    this.id = id;
    this.board = board;
    this.color = this.cardColor();
    this.DOMElement = this.createDOMElement();
    this.setEventHandler();
  }

  setEventHandler() {
    if (!this.DOMElement) {
      throw `Cannot add event handler since the card id ${this.id} has no DOMElement`;
    }

    this.DOMElement.addEventListener("click", (e) => {
      // Necessary to stop propgation in order for column event handler to trigger properly
      if (!this.board.selectedCard) {
        e.stopPropagation();
      }
      this.board.selectCard(this, e);
    });
  }

  createDOMElement() {
    const DOMElement = document.createElement("div");
    DOMElement.classList.add("card");

    if (this.color === CARD_COLORS.red) DOMElement.classList.add("red-color");

    const cardFrontElement = document.createElement("div");
    cardFrontElement.classList.add("card-front");

    const cardBackElement = document.createElement("div");
    cardBackElement.classList.add("card-back");

    const cardValue = document.createElement("h3");
    cardValue.innerText = this.rank;

    const cardSuit = document.createElement("p");
    cardSuit.classList.add("card-suit");
    cardSuit.innerHTML = this.suit;

    const cardSuitTopRow = document.createElement("p");
    cardSuitTopRow.classList.add("card-suit-top-row");
    cardSuitTopRow.innerHTML = this.suit;

    const cardElementTopRowElement = document.createElement("div");
    cardElementTopRowElement.classList.add("card-top-row");
    cardElementTopRowElement.append(cardValue, cardSuitTopRow);

    cardFrontElement.append(cardElementTopRowElement, cardSuit);

    DOMElement.append(cardFrontElement, cardBackElement);

    return DOMElement;
  }

  cardColor() {
    const redSuits = ["&heartsuit;", "&diamondsuit;"];

    if (redSuits.includes(this.suit)) {
      return CARD_COLORS.red;
    } else {
      return CARD_COLORS.black;
    }
  }

  show() {
    this.flipped = true;
    this.DOMElement.classList.remove("card-flipped");
  }
}

class FinalCardPile {
  constructor(id, DOMElement, board) {
    this.id = id;
    this.cards = [];
    this.DOMElement = DOMElement;
    this.board = board;

    this.setEventHandler();
  }

  setEventHandler() {
    this.DOMElement.addEventListener("click", () => {
      if (this.selectedCardCanBeAddedToPile()) {
        this.addSelectedCardToPile();
      }
    });
  }

  selectedCardCanBeAddedToPile() {
    const selectedCard = this.board.selectedCard;
    if (!selectedCard) return false;

    // add the selected card to the pile
    const pile = this;
    const { cards } = pile;

    // first, if the pile is empty then allow only an "A" to be played
    if (cards.length === 0 && selectedCard.rank !== "A") {
      return false;
    }

    // if the pile has cards in it, only allow a card rank that is 1 rank higher to be played
    const lastCardInPile = cards[cards.length - 1];
    if (lastCardInPile) {
      // if the selected card isn't the same suit, prevent it from being played
      if (selectedCard.suit !== lastCardInPile.suit) return false;

      const rankDifference =
        cardValues[selectedCard.rank] - cardValues[lastCardInPile.rank];
      if (rankDifference !== 1) return false;
    }

    return true;
  }

  addSelectedCardToPile() {
    const card = this.board.selectedCard;
    // add card to the pile
    this.cards.push(card);

    // set the card `pile` property
    card.inPile = true;

    // remove the card from the existing column's array
    if (card.columnNumber) {
      this.board.topCardColumns[card.columnNumber].cards.pop();

      if (this.board.topCardColumns[card.columnNumber].cards.length) {
        this.board.topCardColumns[card.columnNumber].showBottomCard();
      }
    }

    // if the card is played from drawn cards, set the next card as top of pile
    if (card.drawnCard) {
      // remove the card from the drawn cards
      const drawnCards = this.board.deck.drawnCards;
      drawnCards.pop();

      if (this.board.deck.drawnCards.length) {
        // set the next drawn card to be the top of the drawn cards pile
        drawnCards[drawnCards.length - 1].topOfDrawnCards = true;
      }
    }

    // remove the card from the column in the DOM and add to the pile's DOm
    this.DOMElement.append(card.DOMElement);

    // flip the new card in the existing column, if there are cards there
    // if (this.board.topCardColumns[card.columnNumber].cards.length) {
    //   this.board.topCardColumns[card.columnNumber].showBottomCard();
    // }

    // remove the selected card
    board.deselectCard();

    // stack the cards on top of each other
    card.DOMElement.style.top = 0;
    card.DOMElement.style.left = 0;
    card.DOMElement.style.position = "absolute";
  }
}

class TopCardColumn {
  constructor(columnNumber, cards = [], board) {
    this.DOMElement = document.querySelector(
      `#top-card-column-${columnNumber}`
    );
    this.columnNumber = columnNumber;
    this.cards = cards;
    this.board = board;

    this.initializeColumnCards();
    this.setEventHandler();
  }

  setEventHandler() {
    this.DOMElement.addEventListener("click", (e) => {
      if (this.board.selectedCard) {
        const lastCardInColumn = this.cards[this.cards.length - 1];

        // determine whether the selected card is playable into a column based on the last column card
        if (this.board.selectedCard !== lastCardInColumn) {
          if (
            this.board.cardCanBePlayed(
              this.board.selectedCard,
              lastCardInColumn
            )
          ) {
            this.addCardToColumn(this.board.selectedCard);
          }
        }
      }
    });
  }

  addCardToColumn(card) {
    if (card.columnNumber) {
      // card can be played from a column into another column

      // find the column that the selected card is in
      const selectedCardcolumnCards =
        this.board.topCardColumns[card.columnNumber].cards;

      // find the location of the selected card within its current column
      const selectedCardColumnIndex = selectedCardcolumnCards
        .map((card) => card.id)
        .indexOf(card.id);

      // remove the card and every card after it from its current column
      const cardsToMove = selectedCardcolumnCards.splice(
        selectedCardColumnIndex,
        selectedCardcolumnCards.length - selectedCardColumnIndex
      );

      // set the new column number for the cards that are moved
      const previousColumn = card.columnNumber;
      cardsToMove.forEach((card) => (card.columnNumber = this.columnNumber));

      // add the removed cards into the new column
      this.cards.push(...cardsToMove);

      // if there are remaining cards in the previous column, show the bottom card
      if (this.board.topCardColumns[previousColumn].cards.length) {
        this.board.topCardColumns[previousColumn].showBottomCard();
      }
    } else if (card.drawnCard) {
      // card can be played from the drawn card pile into a column

      // set style and attributes to match that of a column card
      card.DOMElement.style.position = "static";
      card.topOfDrawnCards = false;
      card.drawnCard = false;
      card.DOMElement.style.left = 0;
      card.columnNumber = this.columnNumber;
      this.cards.push(card);

      const drawnCards = this.board.deck.drawnCards;
      drawnCards.pop();
      if (drawnCards.length) {
        drawnCards[drawnCards.length - 1].topOfDrawnCards = true;
      }
    }
    this.board.deselectCard();

    // re-render the columns that have changes
    this.rerenderColumnCards();
  }

  rerenderColumnCards() {
    const cards = this.cards;

    cards.forEach((card, idx) => {
      card.DOMElement.style.position = "relative";
      card.DOMElement.style.top = `-${idx * 75}px`;

      this.DOMElement.append(card.DOMElement);
    });
  }

  initializeColumnCards() {
    if (!this.columnNumber) {
      throw "There is no column number for this column";
    }

    if (!this.cards.length) throw "This column was created with no cards";

    this.cards.forEach((card, idx) => {
      card.columnNumber = this.columnNumber;
      card.flipped = idx === this.cards.length - 1 ? true : false;
    });

    const cards = this.cards;

    cards.forEach((card, idx) => {
      if (idx !== 0) {
        card.DOMElement.style.position = "relative";
        card.DOMElement.style.top = `-${idx * 75}px`;
      }

      if (idx !== cards.length - 1) {
        card.DOMElement.classList.add("card-flipped");
      }

      document
        .querySelector(`#top-card-column-${this.columnNumber}`)
        .append(card.DOMElement);
    });
  }

  showBottomCard() {
    const columnCards = this.cards;

    columnCards[columnCards.length - 1].show();
  }
}
